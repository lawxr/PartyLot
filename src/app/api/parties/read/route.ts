import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };
const PARTY_COLUMNS =
  'id, code, title, date, time, location, description, cover_image, host_id, host_name, pot_balance, created_at, status, crew_id';
const MEMBER_COLUMNS =
  'party_id, user_id, name, avatar, role, status, nights_together, wallet_address';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (searchParams.has('userId') || searchParams.has('partyId')) {
    return json({ error: 'Party scope is derived from the authenticated user.' }, 400);
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
    const [membershipResult, hostResult] = await Promise.all([
      supabase.from('party_members').select('party_id').eq('user_id', actorId),
      supabase.from('parties').select('id').eq('host_id', actorId),
    ]);

    if (membershipResult.error || hostResult.error || !membershipResult.data || !hostResult.data) {
      return json({ error: 'Party data is temporarily unavailable.' }, 503);
    }

    const partyIds = [...new Set([
      ...membershipResult.data.map((membership) => membership.party_id).filter(Boolean),
      ...hostResult.data.map((party) => party.id).filter(Boolean),
    ])];
    if (partyIds.length === 0) return json({ parties: [] });

    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select(PARTY_COLUMNS)
      .in('id', partyIds)
      .order('created_at', { ascending: false });
    if (partiesError || !parties) {
      return json({ error: 'Party data is temporarily unavailable.' }, 503);
    }

    const { data: members, error: membersError } = await supabase
      .from('party_members')
      .select(MEMBER_COLUMNS)
      .in('party_id', partyIds);
    if (membersError || !members) {
      return json({ error: 'Party data is temporarily unavailable.' }, 503);
    }

    const memberIds = [...new Set(members.map((member) => member.user_id).filter(Boolean))];
    let users: { id: string; handle: string | null; avatar: string | null }[] = [];
    if (memberIds.length > 0) {
      const { data, error: usersError } = await supabase
        .from('users')
        .select('id, handle, avatar')
        .in('id', memberIds);
      if (usersError || !data) {
        return json({ error: 'Party data is temporarily unavailable.' }, 503);
      }
      users = data;
    }

    const cardsByUserId = new Map(users.map((user) => [user.id, user]));
    const membersByPartyId = new Map<string, typeof members>();
    for (const member of members) {
      const partyMembers = membersByPartyId.get(member.party_id) || [];
      partyMembers.push(member);
      membersByPartyId.set(member.party_id, partyMembers);
    }

    return json({
      parties: parties.map((party) => ({
        ...party,
        members: (membersByPartyId.get(party.id) || []).map((member) => ({
          ...member,
          handle: cardsByUserId.get(member.user_id)?.handle || undefined,
          avatar: cardsByUserId.get(member.user_id)?.avatar || member.avatar || undefined,
        })),
      })),
    });
  } catch {
    return json({ error: 'Party data is temporarily unavailable.' }, 503);
  }
}
