import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
}

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const partyId = searchParams.get('partyId');

  try {
    const supabase = getServerSupabase();

    if (partyId) {
      // 1. Authorize actor for this specific party
      const [partyRes, memberRes] = await Promise.all([
        supabase.from('parties').select('host_id').eq('id', partyId).single(),
        supabase.from('party_members').select('user_id').eq('party_id', partyId).eq('user_id', actorId),
      ]);

      const isHost = partyRes.data?.host_id === actorId;
      const isMember = (memberRes.data || []).length > 0;
      if (!isHost && !isMember) {
        return json({ error: 'Access denied to this party activities.' }, 403);
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return json({ error: 'Failed to load activities.' }, 503);
      }

      return json({ activities: data });
    }

    // 2. No partyId: scope to all parties user belongs to
    const [membershipRes, hostRes] = await Promise.all([
      supabase.from('party_members').select('party_id').eq('user_id', actorId),
      supabase.from('parties').select('id').eq('host_id', actorId),
    ]);

    if (membershipRes.error || hostRes.error) {
      return json({ error: 'Failed to load activities.' }, 503);
    }

    const partyIds = [...new Set([
      ...(membershipRes.data || []).map((m: { party_id?: string }) => m.party_id).filter(Boolean),
      ...(hostRes.data || []).map((p: { id?: string }) => p.id).filter(Boolean),
    ])];

    if (partyIds.length === 0) {
      return json({ activities: [] });
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .in('party_id', partyIds)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return json({ error: 'Failed to load activities.' }, 503);
    }

    return json({ activities: data });
  } catch {
    return json({ error: 'Failed to load activities.' }, 503);
  }
}

export async function POST(request: NextRequest) {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const { id, partyId, type, text, time, avatar } = body;
  if (!id || !partyId || !type || !text) {
    return json({ error: 'Missing required activity fields.' }, 400);
  }

  try {
    const supabase = getServerSupabase();

    // Check membership / host
    const [partyRes, memberRes] = await Promise.all([
      supabase.from('parties').select('host_id').eq('id', partyId).single(),
      supabase.from('party_members').select('user_id').eq('party_id', partyId).eq('user_id', actorId),
    ]);

    const isHost = partyRes.data?.host_id === actorId;
    const isMember = (memberRes.data || []).length > 0;
    if (!isHost && !isMember) {
      return json({ error: 'Forbidden: only party members can post activities.' }, 403);
    }

    const payload = {
      id: String(id),
      party_id: String(partyId),
      type: String(type),
      text: String(text),
      time: time ? String(time) : new Date().toISOString(),
      avatar: avatar ? String(avatar) : null,
    };

    const result = await supabase.from('activities').upsert(payload);
    if (result.error) {
      return json({ error: 'Failed to persist activity.' }, 503);
    }

    return json({ success: true, activity: payload }, 200);
  } catch {
    return json({ error: 'Failed to persist activity.' }, 503);
  }
}
