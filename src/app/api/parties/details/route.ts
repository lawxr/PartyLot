import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partyId = searchParams.get('partyId');
  if (!partyId) {
    return json({ error: 'partyId query parameter is required.' }, 400);
  }

  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    return json({ error: 'Authentication is required.' }, 401);
  }

  let actorId: string;
  try {
    const profile = await verifyPrivyToken(match[1]);
    actorId = profile.userId;
    if (!actorId) return json({ error: 'Authentication is required.' }, 401);
  } catch {
    return json({ error: 'Authentication is required.' }, 401);
  }

  try {
    const supabase = getServerSupabase();

    // 1. Fetch party preflight
    const partyResult = await supabase
      .from('parties')
      .select('*')
      .eq('id', partyId)
      .single();

    if (partyResult.error || !partyResult.data) {
      const err = partyResult.error as { code?: string } | null;
      if (err?.code === 'PGRST116') {
        return json({ error: 'Party not found.' }, 404);
      }
      return json({ error: 'Party data is temporarily unavailable.' }, partyResult.data ? 503 : (partyResult.error ? 503 : 404));
    }

    const party = partyResult.data;

    // 2. Authorize actor: must be host or member
    const isHost = party.host_id === actorId;
    if (!isHost) {
      const memberCheck = await supabase
        .from('party_members')
        .select('user_id')
        .eq('party_id', partyId)
        .eq('user_id', actorId);

      if (memberCheck.error || !memberCheck.data || memberCheck.data.length === 0) {
        return json({ error: 'Access denied to this party.' }, 403);
      }
    }

    // 3. Parallel fetch of all scoped details
    const [
      membersRes,
      expensesRes,
      transactionsRes,
      tasksRes,
      activitiesRes,
      memoriesRes,
      pollsRes,
      gameSessionsRes,
    ] = await Promise.all([
      supabase.from('party_members').select('*').eq('party_id', partyId),
      supabase.from('expenses').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('pot_transactions').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('party_memories').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('polls').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
      supabase.from('game_sessions').select('*').eq('party_id', partyId).order('created_at', { ascending: false }),
    ]);

    if (
      membersRes.error ||
      expensesRes.error ||
      transactionsRes.error ||
      tasksRes.error ||
      activitiesRes.error ||
      memoriesRes.error
    ) {
      return json({ error: 'Party details are temporarily unavailable.' }, 503);
    }

    // 4. Enrich member handles and avatars
    const rawMembers = membersRes.data || [];
    const userIds = [...new Set(rawMembers.map((m: { user_id?: string }) => m.user_id).filter(Boolean))];
    let usersMap = new Map<string, { handle: string | null; avatar: string | null }>();

    if (userIds.length > 0) {
      const usersRes = await supabase
        .from('users')
        .select('id, handle, avatar')
        .in('id', userIds);
      if (usersRes.data) {
        usersMap = new Map(usersRes.data.map((u: { id: string; handle: string | null; avatar: string | null }) => [u.id, u]));
      }
    }

    const members = rawMembers.map((m: Record<string, unknown>) => {
      const uid = String(m.user_id || '');
      const userMeta = usersMap.get(uid);
      return {
        ...m,
        handle: userMeta?.handle || m.handle || undefined,
        avatar: userMeta?.avatar || m.avatar || undefined,
      };
    });

    return json({
      party: {
        ...party,
        members,
      },
      members,
      expenses: expensesRes.data || [],
      transactions: transactionsRes.data || [],
      tasks: tasksRes.data || [],
      activities: activitiesRes.data || [],
      memories: memoriesRes.data || [],
      polls: pollsRes.data || [],
      gameSessions: gameSessionsRes.data || [],
    });
  } catch {
    return json({ error: 'Party details are temporarily unavailable.' }, 503);
  }
}
