import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http, parseEther, formatEther, keccak256, toHex } from 'viem';
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

function resolveValidAddress(addressCandidate?: string, fallbackSeed?: string): `0x${string}` {
  if (addressCandidate && addressCandidate.startsWith('0x') && addressCandidate.length === 42) {
    return addressCandidate as `0x${string}`;
  }
  const seed = fallbackSeed || `party-member-${Date.now()}`;
  const hash = keccak256(toHex(seed));
  return `0x${hash.slice(26, 66)}` as `0x${string}`;
}

const ALLOWED_ACTIONS = new Set(['deposit', 'reward', 'reimbursement', 'spend', 'rollover', 'settle']);

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

  const deployerKey = process.env.MONAD_DEPLOYER_PRIVATE_KEY;
  if (!deployerKey || !deployerKey.startsWith('0x') || deployerKey.length !== 66) {
    return NextResponse.json(
      { success: false, error: 'CONFIG_ERROR', message: 'Monad deployer private key is not configured securely on server.' },
      { status: 500 }
    );
  }

  // Authentication check
  const authHeader = request.headers.get('authorization');
  let authenticatedUserId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const verified = await verifyPrivyToken(token);
        authenticatedUserId = verified.userId;
      } catch {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' },
          { status: 401 }
        );
      }
    }
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
      userId,
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

    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (action !== 'rollover' && (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_AMOUNT', message: 'Amount must be a positive number.' },
        { status: 400 }
      );
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

    const recipient = resolveValidAddress(
      recipientAddress || userAddress,
      recipientName || userName || authenticatedUserId || userId
    );

    // Format safe wei amount for MON
    const monWei = parseEther(String(Math.max(0.000001, Number(numAmount.toFixed(6)))));

    // Verify deployer balance has enough native MON for value transactions
    const deployerBalance = await publicMonadClient.getBalance?.({ address: account.address }).catch(() => null);
    if (
      (action === 'deposit' || action === 'settle') &&
      deployerBalance !== null &&
      deployerBalance !== undefined &&
      deployerBalance < monWei
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'INSUFFICIENT_FUNDS',
          message: `Deployer wallet balance (${Number(formatEther(deployerBalance)).toFixed(4)} MON) is insufficient to fund ${numAmount} MON. Please deposit a smaller amount.`,
        },
        { status: 400 }
      );
    }

    let txHash: `0x${string}` | null = null;
    let blockNumber = 65050000;

    // Fail-closed smart contract execution on Monad Testnet with safe gas buffer
    try {
      if (action === 'deposit') {
        txHash = await walletClient.writeContract({
          address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
          abi: PartyTreasuryABI,
          functionName: 'deposit',
          args: [partyBytes],
          value: monWei,
          gas: BigInt(350000),
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
      } else if (action === 'settle') {
        txHash = await walletClient.writeContract({
          address: MONAD_CONTRACT_ADDRESSES.partyTreasury,
          abi: PartyTreasuryABI,
          functionName: 'settleDebt',
          args: [partyBytes, recipient],
          value: monWei,
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

      if (receipt && receipt.status === 'reverted') {
        throw new Error(`Transaction reverted onchain (Hash: ${txHash})`);
      }

      if (receipt) {
        blockNumber = Number(receipt.blockNumber);
      }
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

      // Update parties table pot_balance
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

      await supabase.from('activities').insert({
        id: `act-treasury-${Date.now()}`,
        party_id: partyId,
        type: 'pot',
        text: action === 'deposit'
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
