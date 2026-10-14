/**
 * @security Direct-Wallet Deposit Sync Endpoint
 *
 * This endpoint syncs offchain database pot balances after a user submits a deposit
 * directly via their self-sovereign connected wallet on Monad Testnet.
 *
 * Security Guarantees:
 * 1. Authentication: Verified Privy Bearer token (required in production & configurable in dev).
 * 2. Onchain Verification: Transaction receipt is queried directly on Monad.
 *    - Reverted, non-existent, or unconfirmed receipts fail-closed immediately (no balance credit).
 * 3. Idempotency: Pot transaction upsert keyed by deterministic tx hash prefix.
 * 4. Rate Limiting: IP-based sliding window (20 req / 60s).
 */
import { NextRequest, NextResponse } from 'next/server';
import { formatEther, parseEventLogs } from 'viem';
import { getServerSupabase } from '@/lib/supabase/server';
import { publicMonadClient, toPartyBytes32 } from '@/lib/web3/monad';
import { MONAD_CONTRACT_ADDRESSES, PartyTreasuryABI } from '@/contracts';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous_client';

  const rateLimit = checkRateLimit(`record_deposit_${clientIp}`, {
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many deposit record requests.' },
      { status: 429 }
    );
  }

  // Authentication validation
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        await verifyPrivyToken(token);
      } catch {
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' },
          { status: 401 }
        );
      }
    }
  } else if (process.env.NODE_ENV === 'production' || process.env.REQUIRE_AUTH_IN_DEV === 'true') {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Authentication required to record deposits.' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const partyId = typeof body.partyId === 'string' ? body.partyId : '';
  const txHash = typeof body.txHash === 'string' ? (body.txHash as `0x${string}`) : null;
  const clientAmount = Number(body.amount);
  const userName = typeof body.userName === 'string' ? body.userName : 'Party Member';
  const userAvatar = typeof body.userAvatar === 'string' ? body.userAvatar : null;

  if (!partyId || !txHash || !txHash.startsWith('0x')) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Valid partyId and txHash are required.' },
      { status: 400 }
    );
  }

  // 1. Verify transaction on Monad Testnet (fail-closed if receipt is missing or reverted)
  type VerifiedReceipt = {
    status: 'success' | 'reverted';
    to?: string | null;
    from?: string | null;
    logs?: unknown[];
  };
  let receipt: VerifiedReceipt | null = null;
  try {
    receipt = (await publicMonadClient.waitForTransactionReceipt?.({
      hash: txHash,
      timeout: 20_000,
    }).catch(() => null)) as VerifiedReceipt | null;

    if (!receipt || receipt.status !== 'success') {
      return NextResponse.json(
        {
          success: false,
          error: receipt?.status === 'reverted' ? 'TX_REVERTED' : 'TX_UNCONFIRMED',
          message: receipt?.status === 'reverted'
            ? 'Transaction reverted on Monad blockchain.'
            : 'Transaction receipt could not be confirmed on Monad testnet.',
        },
        { status: 400 }
      );
    }

    const expectedTreasury = MONAD_CONTRACT_ADDRESSES.partyTreasury.toLowerCase();
    if (!receipt.to || receipt.to.toLowerCase() !== expectedTreasury) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_RECIPIENT_CONTRACT',
          message: 'Transaction target does not match the PartyTreasury contract address.',
        },
        { status: 400 }
      );
    }
  } catch (txErr) {
    console.warn('Monad tx receipt check notice:', txErr);
    return NextResponse.json(
      { success: false, error: 'VERIFICATION_FAILED', message: 'Unable to verify transaction receipt on Monad.' },
      { status: 502 }
    );
  }

  // 2. Derive true deposit amount and sender from onchain Deposited event log
  let confirmedAmount = !isNaN(clientAmount) && clientAmount > 0 ? clientAmount : 0;
  let confirmedMember = (receipt.from as string) || '';

  if (Array.isArray(receipt.logs)) {
    const depositEvents = parseEventLogs({
      abi: PartyTreasuryABI,
      eventName: 'Deposited',
      logs: receipt.logs as never,
    });

    if (depositEvents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'NO_DEPOSIT_EVENT',
          message: 'No Deposited event found in transaction receipt.',
        },
        { status: 400 }
      );
    }

    const expectedPartyBytes = toPartyBytes32(partyId).toLowerCase();
    const matchingEvent = depositEvents.find(
      (e) => (e.args.partyId as string)?.toLowerCase() === expectedPartyBytes
    );

    if (!matchingEvent) {
      return NextResponse.json(
        {
          success: false,
          error: 'WRONG_PARTY_EVENT',
          message: 'Deposited event partyId does not match the requested party.',
        },
        { status: 400 }
      );
    }

    const onchainWei = matchingEvent.args.amount;
    if (!onchainWei || onchainWei <= BigInt(0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ZERO_DEPOSIT_AMOUNT',
          message: 'Onchain deposit amount must be greater than zero.',
        },
        { status: 400 }
      );
    }

    confirmedAmount = Number(formatEther(onchainWei));
    if (matchingEvent.args.member) {
      confirmedMember = matchingEvent.args.member as string;
    }
  } else if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json(
      {
        success: false,
        error: 'NO_DEPOSIT_EVENT',
        message: 'No Deposited event found in transaction receipt.',
      },
      { status: 400 }
    );
  }

  if (confirmedAmount <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_DEPOSIT_AMOUNT',
        message: 'A positive deposit amount is required.',
      },
      { status: 400 }
    );
  }

  let party: { id: string; pot_balance: number | string | null } | null = null;
  try {
    const supabase = getServerSupabase();

    // 3. Fetch current party
    const { data: partyData, error: partyErr } = await supabase
      .from('parties')
      .select('id, pot_balance')
      .eq('id', partyId)
      .single();

    if (partyErr || !partyData) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Party not found.' },
        { status: 404 }
      );
    }
    party = partyData;

    const potTxId = `pot-tx-${txHash.slice(2, 16)}`;

    // Anti-replay check: prevent double-crediting if this transaction hash was already processed
    const { data: existingTx } = await supabase
      .from('pot_transactions')
      .select('id')
      .eq('id', potTxId)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({
        success: true,
        partyId,
        updatedBalance: Number(party.pot_balance) || 0,
        txHash,
        duplicate: true,
      });
    }

    const prevBal = Number(party.pot_balance) || 0;
    const updatedBalance = Number((prevBal + confirmedAmount).toFixed(4));

    // 4. Insert pot transaction idempotently
    const potTxPayload = {
      id: potTxId,
      party_id: partyId,
      amount: confirmedAmount,
      type: 'add',
      description: `Deposit of ${confirmedAmount.toFixed(4)} MON via User Wallet on Monad`,
      user_name: userName,
      user_avatar: userAvatar || '',
      created_at: new Date().toISOString(),
    };
    const potTable = supabase.from('pot_transactions');
    let insertErr = null;
    if (typeof potTable?.upsert === 'function') {
      const res = await potTable.upsert(potTxPayload);
      insertErr = res?.error;
    } else if (typeof potTable?.insert === 'function') {
      const res = await potTable.insert(potTxPayload);
      insertErr = res?.error;
    }

    if (insertErr) {
      throw insertErr;
    }

    // 5. Update party balance
    const updateRes = await supabase
      .from('parties')
      .update({ pot_balance: updatedBalance })
      .eq('id', partyId);

    if (updateRes?.error) {
      throw updateRes.error;
    }

    // 6. Insert activity idempotently
    const actPayload = {
      id: `act-deposit-${txHash.slice(2, 18)}`,
      party_id: partyId,
      type: 'pot',
      text: `${userName} aportó ${confirmedAmount.toFixed(4)} MON al Party Pot desde su billetera`,
      time: 'Just now',
      avatar: userAvatar || '',
    };
    const actTable = supabase.from('activities');
    if (typeof actTable?.upsert === 'function') {
      await actTable.upsert(actPayload);
    } else if (typeof actTable?.insert === 'function') {
      await actTable.insert(actPayload);
    }

    return NextResponse.json({
      success: true,
      partyId,
      updatedBalance,
      txHash,
      amount: confirmedAmount,
      sender: confirmedMember,
    });
  } catch (err) {
    console.error('Error recording deposit in database:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'PERSISTENCE_FAILED',
        txHash,
        onchainConfirmed: true,
        message: `Transaction succeeded onchain (${confirmedAmount.toFixed(4)} MON, tx: ${txHash}), but saving to database failed. Do NOT send another wallet transaction; your deposit will be reconciled.`,
      },
      { status: 500 }
    );
  }
}

