import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS });
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

  const { id, partyId, imageUrl, caption, uploadedByName, uploadedByAvatar } = body;
  if (!id || !partyId || !imageUrl) {
    return json({ error: 'Missing required memory fields (id, partyId, imageUrl).' }, 400);
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
      return json({ error: 'Forbidden: only party members can upload memories.' }, 403);
    }

    const payload = {
      id: String(id),
      party_id: String(partyId),
      image_url: String(imageUrl),
      caption: caption ? String(caption) : null,
      uploaded_by_id: actorId, // Authenticated actor identity, no client spoofing
      uploaded_by_name: uploadedByName ? String(uploadedByName) : 'Member',
      uploaded_by_avatar: uploadedByAvatar ? String(uploadedByAvatar) : null,
      created_at: new Date().toISOString(),
    };

    const result = await supabase.from('party_memories').insert(payload);
    if (result.error) {
      return json({ error: 'Failed to persist party memory.' }, 503);
    }

    return json({ success: true, memory: payload }, 200);
  } catch {
    return json({ error: 'Failed to persist party memory.' }, 503);
  }
}
