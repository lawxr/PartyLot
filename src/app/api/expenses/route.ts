import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { isExplicitDevelopmentDemoMode } from '@/lib/runtimeMode';
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
    if (!isExplicitDevelopmentDemoMode()) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'Authentication is required to record expenses.' },
        { status: 401 }
      );
    }
    verifiedUser = {
      userId: typeof body.paidById === 'string' ? body.paidById : `demo-user-${Date.now()}`,
      name: typeof body.paidByName === 'string' ? body.paidByName : 'Party Member',
      handle: '@member',
      avatar: null,
    };
  }

  const partyId = typeof body.partyId === 'string' ? body.partyId : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const amount = Number(body.amount);
  const category = (typeof body.category === 'string' ? body.category : 'general') as ExpenseCategory;
  const splitBetweenIds = Array.isArray(body.splitBetweenIds) ? (body.splitBetweenIds as string[]) : [];

  if (!partyId || !description || isNaN(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Valid partyId, description, and positive amount are required.' },
      { status: 400 }
    );
  }

  const expenseId = typeof body.id === 'string' && body.id ? body.id : `exp-${Date.now()}`;
  const paidById = verifiedUser.userId;
  const paidByName = verifiedUser.name;
  const paidByAvatar =
    verifiedUser.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

  try {
    const supabase = getServerSupabase();

    // 1. Verify party exists
    const { data: party, error: partyErr } = await supabase
      .from('parties')
      .select('id, title')
      .eq('id', partyId)
      .single();

    if (partyErr || !party) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Party not found.' },
        { status: 404 }
      );
    }

    // 2. Insert expense record
    const { error: insertErr } = await supabase.from('expenses').upsert({
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
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: 'Failed to record expense.' },
        { status: 500 }
      );
    }

    // 3. Insert activity record
    const categoryTag = category !== 'general' ? `[${category.toUpperCase()}] ` : '';
    await supabase.from('activities').insert({
      id: `act-${Date.now()}`,
      party_id: partyId,
      type: 'expense',
      text: `${paidByName} added ${categoryTag}expense: "${description}" ($${amount.toFixed(2)})`,
      time: 'Just now',
      avatar: paidByAvatar,
    });

    const createdExpense: Expense = {
      id: expenseId,
      partyId,
      description,
      amount,
      paidById,
      paidByName,
      paidByAvatar,
      splitBetweenIds,
      category,
      isSettled: false,
      createdAt: 'Just now',
    };

    return NextResponse.json({ success: true, expense: createdExpense }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error creating expense:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Unexpected server error while recording expense.' },
      { status: 500 }
    );
  }
}
