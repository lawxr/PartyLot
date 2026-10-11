import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { publicMonadClient } from '@/lib/web3/monad';
import { checkRateLimit } from '@/lib/security/rateLimit';

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
  const amount = Number(body.amount);
  const userName = typeof body.userName === 'string' ? body.userName : 'Party Member';
  const userAvatar = typeof body.userAvatar === 'string' ? body.userAvatar : null;

  if (!partyId || !txHash || !txHash.startsWith('0x') || isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Valid partyId, txHash, and positive amount are required.' },
      { status: 400 }
    );
  }

  // 1. Verify transaction on Monad Testnet
  try {
    const receipt = await publicMonadClient.waitForTransactionReceipt?.({
      hash: txHash,
      timeout: 20_000,
    }).catch(() => null);

    if (receipt && receipt.status === 'reverted') {
      return NextResponse.json(
        { success: false, error: 'TX_REVERTED', message: 'Transaction reverted on Monad blockchain.' },
        { status: 400 }
      );
    }
  } catch (txErr) {
    console.warn('Monad tx receipt check notice:', txErr);
  }

  try {
    const supabase = getServerSupabase();

    // 2. Fetch current party
    const { data: party, error: partyErr } = await supabase
      .from('parties')
      .select('id, pot_balance')
      .eq('id', partyId)
      .single();

    if (partyErr || !party) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Party not found.' },
        { status: 404 }
      );
    }

    const prevBal = Number(party.pot_balance) || 0;
    const updatedBalance = Number((prevBal + amount).toFixed(4));

    // 3. Insert pot transaction
    await supabase.from('pot_transactions').upsert({
      id: `pot-tx-${txHash.slice(2, 16)}`,
      party_id: partyId,
      amount,
      type: 'add',
      description: `Deposit of ${amount.toFixed(4)} MON via User Wallet on Monad`,
      user_name: userName,
      user_avatar: userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      created_at: new Date().toISOString(),
    });

    // 4. Update party balance
    await supabase
      .from('parties')
      .update({ pot_balance: updatedBalance })
      .eq('id', partyId);

    // 5. Insert activity
    await supabase.from('activities').insert({
      id: `act-treasury-${Date.now()}`,
      party_id: partyId,
      type: 'pot',
      text: `💰 ${userName} aportó ${amount.toFixed(4)} MON al Party Pot desde su billetera`,
      time: 'Just now',
    });

    return NextResponse.json({
      success: true,
      partyId,
      updatedBalance,
      txHash,
    });
  } catch (err) {
    console.error('Error recording deposit in database:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to record deposit.' },
      { status: 500 }
    );
  }
}
