import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { checkRateLimit } from '@/lib/security/rateLimit';
import type { Expense, ExpenseCategory } from '@/types';

export async function POST(request: NextRequest) {
  // 1. Rate limiting against expense spam
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous_client';

  const rateLimit = checkRateLimit(`expense_create_${clientIp}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many expense creation requests. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // 2. Authentication verification via Privy Bearer token
  const authHeader = request.headers.get('authorization');
  let verifiedUser: {
    userId: string;
    name: string;
    handle: string;
    avatar: string | null;
  } | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const verified = await verifyPrivyToken(token);
        verifiedUser = {
          userId: verified.userId,
          name: verified.name,
          handle: verified.handle,
          avatar: verified.avatar,
        };
      } catch (authErr) {
        console.warn('Privy token verification failed in expense creation:', authErr);
        return NextResponse.json(
          { success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' },
          { status: 401 }
        );
      }
    }
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

  if (!verifiedUser) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Authentication is required to record expenses.' },
      { status: 401 }
    );
  }

  const partyId = typeof body.partyId === 'string' ? body.partyId.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const amount = Number(body.amount);
  const category = (typeof body.category === 'string' ? body.category : 'general') as ExpenseCategory;
  const splitBetweenIds = body.splitBetweenIds === undefined
    ? []
    : Array.isArray(body.splitBetweenIds)
      ? body.splitBetweenIds
      : null;
  const requestedPaidById = body.paidById === undefined ? verifiedUser.userId : body.paidById;

  if (
    !partyId ||
    !description ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    (body.id !== undefined && (typeof body.id !== 'string' || !body.id.trim())) ||
    (typeof requestedPaidById !== 'string' || !requestedPaidById.trim()) ||
    !splitBetweenIds ||
    splitBetweenIds.some((id) => typeof id !== 'string' || !id.trim()) ||
    new Set(splitBetweenIds).size !== splitBetweenIds.length
  ) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Valid partyId, description, and positive amount are required.' },
      { status: 400 }
    );
  }

  const expenseId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `exp-${Date.now()}`;

  try {
    const supabase = getServerSupabase();

    // 1. Resolve the party's host and member list before accepting any expense target.
    const { data: party, error: partyErr } = await supabase
      .from('parties')
      .select('id, title, host_id')
      .eq('id', partyId)
      .maybeSingle();

    if (partyErr) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Unable to verify party access.' },
        { status: 503 }
      );
    }
    if (!party) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Party not found.' },
        { status: 404 }
      );
    }

    const { data: partyMembers, error: membersErr } = await supabase
      .from('party_members')
      .select('user_id, name, avatar')
      .eq('party_id', partyId);
    if (membersErr || !Array.isArray(partyMembers)) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Unable to verify party membership.' },
        { status: 503 }
      );
    }

    const membersById = new Map(
      partyMembers
        .filter((member) => typeof member.user_id === 'string' && member.user_id.trim())
        .map((member) => [member.user_id as string, member])
    );
    if (party.host_id !== verifiedUser.userId && !membersById.has(verifiedUser.userId)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'You must belong to this party to record an expense.' },
        { status: 403 }
      );
    }

    const paidById = (requestedPaidById as string).trim();
    const payer = membersById.get(paidById);
    if (!payer || splitBetweenIds.some((id) => !membersById.has(id as string))) {
      return NextResponse.json(
        { success: false, error: 'BAD_REQUEST', message: 'Payer and split participants must be members of this party.' },
        { status: 400 }
      );
    }

    const paidByName = typeof payer.name === 'string' ? payer.name : '';
    const paidByAvatar = typeof payer.avatar === 'string' && payer.avatar
      ? payer.avatar
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

    // 2. Insert only; expense IDs are never update selectors.
    const { error: insertErr } = await supabase.from('expenses').insert({
      id: expenseId,
      party_id: partyId,
      description,
      amount,
      paid_by_id: paidById,
      paid_by_name: paidByName,
      split_between_ids: splitBetweenIds,
      category,
      is_settled: false,
      tx_hash: null,
    });

    if (insertErr) {
      console.error('Supabase expense insert error:', insertErr);
      if ((insertErr as { code?: string }).code === '23505') {
        return NextResponse.json(
          { success: false, error: 'CONFLICT', message: 'An expense with this ID already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Failed to record expense.' },
        { status: 503 }
      );
    }

    // 3. Insert activity record
    const categoryTag = category !== 'general' ? `[${category.toUpperCase()}] ` : '';
    let activityErr: unknown = null;
    try {
      const result = await supabase.from('activities').insert({
        id: `act-${Date.now()}`,
        party_id: partyId,
        type: 'expense',
        text: `${paidByName} added ${categoryTag}expense: "${description}" ($${amount.toFixed(2)})`,
        time: 'Just now',
        avatar: paidByAvatar,
      });
      activityErr = result.error;
    } catch (err) {
      activityErr = err;
    }
    if (activityErr) {
      console.error('Supabase expense activity insert error:', activityErr);
    }

    const createdExpense: Expense = {
      id: expenseId,
      partyId,
      description,
      amount,
      paidById,
      paidByName,
      paidByAvatar,
      splitBetweenIds: splitBetweenIds as string[],
      category,
      isSettled: false,
      createdAt: 'Just now',
    };

    return NextResponse.json({
      success: true,
      expense: createdExpense,
      ...(activityErr ? { warning: 'Expense saved, but activity could not be recorded.' } : {}),
    }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error creating expense:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Unexpected server error while recording expense.' },
      { status: 500 }
    );
  }
}
