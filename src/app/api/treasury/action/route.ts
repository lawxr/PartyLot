import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseEther, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet, publicMonadClient, getMonadExplorerTxUrl } from '@/lib/web3/monad';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI } from '@/contracts';
import { getServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';

export function toPartyBytes32(partyId: string): `0x${string}` {
  if (!partyId) return `0x${'0'.repeat(64)}` as `0x${string}`;
  if (partyId.startsWith('0x') && partyId.length === 66) {
    return partyId as `0x${string}`;
  }
  return keccak256(toHex(partyId));
}

const ALLOWED_ACTIONS = new Set(['deposit', 'reward', 'reimbursement', 'spend', 'rollover', 'settle', 'register']);
const RELAYER_FUNDED_USER_ACTIONS = new Set(['deposit', 'settle']);
const HOST_ONLY_ACTIONS = new Set(['reward', 'reimbursement', 'spend', 'rollover', 'register']);

export async function POST(request: NextRequest) {
  // Rate limiting against spam
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous_client';

  const rateLimit = checkRateLimit(`treasury_action_${clientIp}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many treasury requests. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Authentication check - strictly required for financial state changes
  const authHeader = request.headers.get('authorization');
  let authenticatedUserId: string | null = null;
  let authenticatedWalletAddress: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const verified = await verifyPrivyToken(token);
        authenticatedUserId = verified.userId;
        authenticatedWalletAddress = verified.walletAddress;
      } catch {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' },
          { status: 401 }
        );
      }
    }
  }

  if (!authenticatedUserId) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Authentication is strictly required for treasury operations.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: 'Malformed JSON payload.' },
        { status: 400 }
      );
    }

    const {
      action,
      partyId,
      toPartyId,
      amount,
      userAddress,
      userName,
      recipientAddress,
      recipientName,
      role,
      description,
    } = body;

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_ACTION',
          message: `Action must be one of: ${Array.from(ALLOWED_ACTIONS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!partyId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_PARTY_ID', message: 'partyId is required for treasury actions.' },
        { status: 400 }
      );
    }

    // User-obligation transfers must use the connected wallet, not the server relayer.
    if (RELAYER_FUNDED_USER_ACTIONS.has(action)) {
      return NextResponse.json(
        { success: false, error: 'ACTION_UNAVAILABLE', message: 'Connect your wallet to make this transfer directly.' },
        { status: 503 }
      );
    }

    // Every privileged contract action requires a verified host identity and a successful host lookup.
    if (HOST_ONLY_ACTIONS.has(action)) {
      if (!authenticatedUserId || authenticatedUserId === 'demo-user') {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'A verified party host is required for this treasury action.' },
          { status: 401 }
        );
      }

      let partyRecord: { host_id?: string | null } | null = null;
      try {
        const supabase = getServerSupabase();
        const result = await supabase
          .from('parties')
          .select('host_id')
          .eq('id', partyId)
          .single();
        if (result.error) throw result.error;
        partyRecord = result.data;
      } catch {
        return NextResponse.json(
          { success: false, error: 'AUTHORIZATION_UNAVAILABLE', message: 'Party host authorization could not be verified.' },
          { status: 503 }
        );
      }

      if (!partyRecord?.host_id) {
        return NextResponse.json(
          { success: false, error: 'AUTHORIZATION_UNAVAILABLE', message: 'Party host authorization could not be verified.' },
          { status: 503 }
        );
      }

      if (authenticatedUserId !== partyRecord.host_id) {
        return NextResponse.json(
          { success: false, error: 'FORBIDDEN', message: 'Only the party host is authorized to execute this treasury action.' },
          { status: 403 }
        );
      }

      if (action === 'register' && (!authenticatedWalletAddress || !/^0x[a-fA-F0-9]{40}$/.test(authenticatedWalletAddress))) {
        return NextResponse.json(
          { success: false, error: 'HOST_WALLET_UNAVAILABLE', message: 'The verified party host wallet could not be resolved.' },
          { status: 503 }
        );
      }
    }

    const deployerKey = process.env.MONAD_DEPLOYER_PRIVATE_KEY;
    if (!deployerKey || !deployerKey.startsWith('0x') || deployerKey.length !== 66) {
      return NextResponse.json(
        { success: false, error: 'CONFIG_ERROR', message: 'Monad deployer private key is not configured securely on server.' },
        { status: 500 }
      );
    }

    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (action !== 'rollover' && action !== 'register' && (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT', message: 'Amount must be a positive number.' },
        { status: 400 }
      );
    }

    // Validate recipient address strictly for distribution actions
    const candidateAddress = recipientAddress || userAddress;
    if (action !== 'rollover' && action !== 'register') {
      if (!candidateAddress || !candidateAddress.startsWith('0x') || candidateAddress.length !== 42) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_RECIPIENT_ADDRESS',
            message: 'Recipient address must be a valid 42-character Monad/Ethereum hex address (0x...).',
          },
          { status: 400 }
        );
      }
    }

    const partyBytes = toPartyBytes32(partyId);
    const account = privateKeyToAccount(deployerKey as `0x${string}`);
    const rpcUrl =
      process.env.NEXT_PUBLIC_MONAD_RPC_URL &&
      !process.env.NEXT_PUBLIC_MONAD_RPC_URL.includes('your-api-key')
        ? process.env.NEXT_PUBLIC_MONAD_RPC_URL
        : 'https://testnet-rpc.monad.xyz';

    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrl),
    });

    const recipient = (candidateAddress?.startsWith('0x') && candidateAddress.length === 42)
      ? (candidateAddress as `0x${string}`)
      : (account.address as `0x${string}`);

    if (action === 'register') {
      // Registration identity comes from the verified party host, never caller-controlled request fields.
      const partyData = await publicMonadClient.readContract({
        address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
        abi: PartyTreasuryABI,
        functionName: 'parties',
        args: [partyBytes],
      });
      if (partyData?.[4]) {
        if (String(partyData[0]).toLowerCase() !== authenticatedWalletAddress?.toLowerCase()) {
          return NextResponse.json(
            { success: false, error: 'FORBIDDEN', message: 'The onchain party is registered to a different host wallet.' },
            { status: 403 }
          );
        }
        return NextResponse.json({ success: true, partyId, alreadyRegistered: true, message: 'Party is already registered onchain.' });
      }
    }

    // Format safe wei amount for MON
    const monWei = action === 'register' || action === 'rollover'
      ? BigInt(0)
      : parseEther(String(Math.max(0.000001, Number(numAmount.toFixed(6)))));

    let txHash: `0x${string}` | null = null;
    let blockNumber = 0;

    // Fail-closed smart contract execution on Monad Testnet with safe gas buffer
    try {
      if (action === 'register') {
        txHash = await walletClient.writeContract({
          address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
          abi: PartyTreasuryABI,
          functionName: 'registerParty',
          args: [partyBytes, authenticatedWalletAddress as `0x${string}`],
          gas: BigInt(250000),
        });
      } else if (action === 'reward') {
        txHash = await walletClient.writeContract({
          address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
          abi: PartyTreasuryABI,
          functionName: 'distributeReward',
          args: [partyBytes, recipient, monWei, role || 'CONTRIBUTOR_BOUNTY'],
          gas: BigInt(350000),
        });
      } else if (action === 'reimbursement' || action === 'spend') {
        txHash = await walletClient.writeContract({
          address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
          abi: PartyTreasuryABI,
          functionName: 'executeReimbursement',
          args: [partyBytes, recipient, monWei, description || 'Party expense reimbursement'],
          gas: BigInt(350000),
        });
      } else if (action === 'rollover') {
        const destPartyBytes = toPartyBytes32(toPartyId || 'next-party');
        txHash = await walletClient.writeContract({
          address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
          abi: PartyTreasuryABI,
          functionName: 'rolloverToNextParty',
          args: [partyBytes, destPartyBytes],
          gas: BigInt(350000),
        });
      }

      if (!txHash) {
        throw new Error('Transaction was not broadcast by wallet client.');
      }

      // Confirm receipt on Monad
      const receipt = await publicMonadClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 20_000,
      });

      if (!receipt || receipt.status !== 'success') {
        throw new Error(receipt?.status === 'reverted' ? `Transaction reverted onchain (Hash: ${txHash})` : 'Transaction receipt could not be confirmed onchain.');
      }

      blockNumber = Number(receipt.blockNumber);
    } catch (contractErr) {
      console.error('Monad Treasury transaction execution failed:', contractErr);
      return NextResponse.json(
        {
          success: false,
          error: 'TRANSACTION_FAILED',
          message: contractErr instanceof Error ? contractErr.message : 'Smart contract transaction failed on Monad.',
        },
        { status: 502 }
      );
    }

    const explorerUrl = getMonadExplorerTxUrl(txHash);

    // Synchronize Supabase persistent state upon confirmed onchain transaction
    try {
      const supabase = getServerSupabase();
      const txId = `pot-tx-${Date.now()}`;
      await supabase.from('pot_transactions').insert({
        id: txId,
        party_id: partyId,
        amount: numAmount,
        type: action === 'deposit' ? 'add' : action === 'reward' ? 'reward' : action === 'rollover' ? 'rollover' : 'spend',
        description: description || `${action.toUpperCase()} of ${numAmount.toFixed(4)} MON on Monad`,
        user_name: userName || 'Law',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        created_at: new Date().toISOString(),
      });

      // Update parties table pot_balance (skip for registration)
      if (action !== 'register') {
        const partiesTable = supabase.from('parties');
        if (typeof partiesTable?.select === 'function') {
          const { data: currentParty } = await partiesTable
            .select('pot_balance')
            .eq('id', partyId)
            .single();
          const prevBal = Number(currentParty?.pot_balance) || 0;
          const updatedBalance =
            action === 'deposit'
              ? prevBal + numAmount
              : Math.max(0, prevBal - numAmount);
          if (typeof partiesTable.update === 'function') {
            await partiesTable
              .update({ pot_balance: Number(updatedBalance.toFixed(4)) })
              .eq('id', partyId);
          }
        }
      }

      await supabase.from('activities').insert({
        id: `act-treasury-${Date.now()}`,
        party_id: partyId,
        type: 'pot',
        text: action === 'register'
          ? `🎉 Tesorería onchain registrada en Monad Testnet`
          : action === 'deposit'
          ? `💰 ${userName || 'Alguien'} aportó ${numAmount.toFixed(4)} MON al Party Pot (Monad)`
          : action === 'reward'
          ? `🏆 Recompensa de ${numAmount.toFixed(4)} MON para ${recipientName || 'contribuidor'} (${role})`
          : action === 'settle'
          ? `⚡ Liquidación de deuda de ${numAmount.toFixed(4)} MON registrada en Monad`
          : `💸 Gasto de ${numAmount.toFixed(4)} MON registrado en el Pot`,
        time: 'Just now',
      });
    } catch (dbErr) {
      console.warn('Supabase treasury sync notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      action,
      amount: numAmount,
      token: 'MON',
      network: 'Monad Testnet',
      chainId: 10143,
      txHash,
      blockNumber,
      explorerUrl,
    });
  } catch (err) {
    console.error('Treasury action handler error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown treasury action error',
      },
      { status: 500 }
    );
  }
}
