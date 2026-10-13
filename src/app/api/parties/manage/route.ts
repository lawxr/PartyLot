import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { getServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { generatePartyCode } from '@/services/party';
import { getPartyPotBalanceOnchain } from '@/services/treasury';
import { buildPartyPatch } from '@/lib/partyAdmin';

/**
 * Host administration for a party.
 *
 *   GET    ?partyId=…           → people the host can add (crew-mates + people from past parties)
 *   PATCH  { partyId, updates } → edit title / date / time / location / description / coverImage (host)
 *   POST   { partyId, action }  → members: add | remove (host), leave (any non-host member),
 *                                  rotate-code (host: revoke the invite code and issue a new one)
 *   DELETE ?partyId=…           → delete the party (host; refused while the pot holds funds)
 *
 * Every write uses the caller's verified Privy id; nothing about identity or role is read from the body.
 */

export const dynamic = 'force-dynamic';

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

type Supabase = ReturnType<typeof getServerSupabase>;
type PartyRow = { id: string; host_id: string | null; host_name?: string | null; title?: string; pot_balance?: number | string | null; crew_id?: string | null; code?: string };

async function authenticate(request: NextRequest): Promise<{ userId: string; name: string } | null> {
  const match = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) return null;
  try {
    const profile = await verifyPrivyToken(match[1]);
    return profile.userId ? { userId: profile.userId, name: profile.name || 'Host' } : null;
  } catch {
    return null;
  }
}

function rateLimited(actorId: string) {
  return !checkRateLimit(`party_manage_${actorId}`, { limit: 40, windowMs: 60 * 1000 }).allowed;
}

async function loadParty(supabase: Supabase, partyId: string): Promise<{ party: PartyRow | null; error: boolean }> {
  const res = await supabase.from('parties').select('id, host_id, host_name, title, pot_balance, crew_id, code').eq('id', partyId).maybeSingle();
  if (res.error) return { party: null, error: true };
  return { party: (res.data as PartyRow | null) ?? null, error: false };
}

async function logActivity(supabase: Supabase, partyId: string, text: string, type = 'join') {
  try {
    await supabase.from('activities').insert({ id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, party_id: partyId, type, text, time: 'Just now' });
  } catch {
    // activity is best-effort; the admin action already succeeded
  }
}

// ── GET: candidates the host can add ───────────────────────────────────────
export async function GET(request: NextRequest) {
  const actor = await authenticate(request);
  if (!actor) return json({ error: 'Authentication is required.' }, 401);
  const partyId = new URL(request.url).searchParams.get('partyId');
  if (!partyId) return json({ error: 'partyId is required.' }, 400);

  try {
    const supabase = getServerSupabase();
    const { party, error } = await loadParty(supabase, partyId);
    if (error) return json({ error: 'Party data is temporarily unavailable.' }, 503);
    if (!party) return json({ error: 'Party not found.' }, 404);
    if (party.host_id !== actor.userId) return json({ error: 'Only the host can add people.' }, 403);

    const [currentRes, crewRes, pastRes] = await Promise.all([
      supabase.from('party_members').select('user_id').eq('party_id', partyId),
      supabase.from('crew_members').select('crew_id').eq('user_id', actor.userId),
      supabase.from('party_members').select('party_id').eq('user_id', actor.userId),
    ]);
    if (currentRes.error || crewRes.error || pastRes.error) return json({ error: 'Candidates are temporarily unavailable.' }, 503);

    const inParty = new Set(((currentRes.data || []) as { user_id: string }[]).map((r) => r.user_id));
    const crewIds = [...new Set(((crewRes.data || []) as { crew_id: string }[]).map((r) => r.crew_id))];
    if (party.crew_id) crewIds.push(party.crew_id);
    const pastPartyIds = ((pastRes.data || []) as { party_id: string }[]).map((r) => r.party_id).filter((id) => id !== partyId);

    const [crewMates, pastMates] = await Promise.all([
      crewIds.length ? supabase.from('crew_members').select('user_id').in('crew_id', crewIds) : Promise.resolve({ data: [], error: null }),
      pastPartyIds.length ? supabase.from('party_members').select('user_id').in('party_id', pastPartyIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (crewMates.error || pastMates.error) return json({ error: 'Candidates are temporarily unavailable.' }, 503);

    const ids = [
      ...new Set(
        [...((crewMates.data || []) as { user_id: string }[]), ...((pastMates.data || []) as { user_id: string }[])]
          .map((r) => r.user_id)
          .filter((id) => id && id !== actor.userId && !inParty.has(id)),
      ),
    ].slice(0, 100);
    if (!ids.length) return json({ candidates: [] });

    const usersRes = await supabase.from('users').select('id, name, handle, avatar').in('id', ids);
    if (usersRes.error) return json({ error: 'Candidates are temporarily unavailable.' }, 503);
    const candidates = ((usersRes.data || []) as { id: string; name: string; handle?: string; avatar?: string }[])
      .map((u) => ({ id: u.id, name: u.name, handle: u.handle || undefined, avatar: u.avatar || '' }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return json({ candidates });
  } catch {
    return json({ error: 'Candidates are temporarily unavailable.' }, 503);
  }
}

// ── PATCH: edit party details ──────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const actor = await authenticate(request);
  if (!actor) return json({ error: 'Authentication is required.' }, 401);
  if (rateLimited(actor.userId)) return json({ error: 'Too many changes. Please wait a minute.' }, 429);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const partyId = typeof body.partyId === 'string' ? body.partyId : '';
  if (!partyId) return json({ error: 'partyId is required.' }, 400);
  const { patch, error: patchError } = buildPartyPatch(body.updates);
  if (patchError) return json({ error: patchError }, 400);

  try {
    const supabase = getServerSupabase();
    const { party, error } = await loadParty(supabase, partyId);
    if (error) return json({ error: 'Party data is temporarily unavailable.' }, 503);
    if (!party) return json({ error: 'Party not found.' }, 404);
    if (party.host_id !== actor.userId) return json({ error: 'Only the host can edit this party.' }, 403);

    const res = await supabase.from('parties').update(patch).eq('id', partyId).eq('host_id', actor.userId);
    if (res.error) return json({ error: 'Failed to update the party.' }, 503);
    await logActivity(supabase, partyId, `${party.host_name || actor.name} updated the party details`);
    return json({ success: true, partyId, updated: Object.keys(patch) });
  } catch {
    return json({ error: 'Failed to update the party.' }, 503);
  }
}

// ── POST: member actions ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const actor = await authenticate(request);
  if (!actor) return json({ error: 'Authentication is required.' }, 401);
  if (rateLimited(actor.userId)) return json({ error: 'Too many changes. Please wait a minute.' }, 429);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }
  const partyId = typeof body.partyId === 'string' ? body.partyId : '';
  const action = body.action;
  const targetUserId = typeof body.userId === 'string' ? body.userId : '';
  if (!partyId) return json({ error: 'partyId is required.' }, 400);
  if (action !== 'add' && action !== 'remove' && action !== 'leave' && action !== 'rotate-code') {
    return json({ error: 'action must be add, remove, leave or rotate-code.' }, 400);
  }

  try {
    const supabase = getServerSupabase();
    const { party, error } = await loadParty(supabase, partyId);
    if (error) return json({ error: 'Party data is temporarily unavailable.' }, 503);
    if (!party) return json({ error: 'Party not found.' }, 404);
    const isHost = party.host_id === actor.userId;

    if (action === 'leave') {
      if (isHost) return json({ error: 'The host cannot leave. Delete the party instead.' }, 409);
      const res = await supabase.from('party_members').delete().eq('party_id', partyId).eq('user_id', actor.userId);
      if (res.error) return json({ error: 'Failed to leave the party.' }, 503);
      await logActivity(supabase, partyId, `${actor.name} left the party`);
      return json({ success: true, partyId, left: actor.userId });
    }

    if (!isHost) return json({ error: 'Only the host can manage people.' }, 403);

    if (action === 'rotate-code') {
      const newCode = generatePartyCode();
      const revoke = await supabase.from('invitations').update({ is_revoked: true }).eq('party_id', partyId);
      if (revoke.error) return json({ error: 'Failed to revoke the old invite.' }, 503);
      const insert = await supabase.from('invitations').insert({
        party_id: partyId,
        code: newCode,
        max_uses: 50,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_revoked: false,
      });
      if (insert.error) return json({ error: 'Failed to create the new invite.' }, 503);
      const upd = await supabase.from('parties').update({ code: newCode }).eq('id', partyId).eq('host_id', actor.userId);
      if (upd.error) return json({ error: 'Failed to save the new invite code.' }, 503);
      return json({ success: true, partyId, code: newCode });
    }

    if (!targetUserId) return json({ error: 'userId is required.' }, 400);
    if (targetUserId === actor.userId) return json({ error: 'The host cannot add or remove themselves.' }, 409);

    if (action === 'remove') {
      const res = await supabase.from('party_members').delete().eq('party_id', partyId).eq('user_id', targetUserId);
      if (res.error) return json({ error: 'Failed to remove this person.' }, 503);
      return json({ success: true, partyId, removed: targetUserId });
    }

    // add: only people the host already knows (crew-mates or people from past parties)
    const [userRes, existingRes] = await Promise.all([
      supabase.from('users').select('id, name, avatar, wallet_address').eq('id', targetUserId).maybeSingle(),
      supabase.from('party_members').select('user_id').eq('party_id', partyId).eq('user_id', targetUserId),
    ]);
    if (userRes.error || existingRes.error) return json({ error: 'Unable to add this person right now.' }, 503);
    const user = userRes.data as { id: string; name: string; avatar?: string | null; wallet_address?: string | null } | null;
    if (!user) return json({ error: 'This person does not have a Partylot account yet. Share the invite link instead.' }, 404);
    if ((existingRes.data || []).length) return json({ success: true, partyId, added: targetUserId, alreadyMember: true });

    const [sharedCrew, sharedParty] = await Promise.all([
      supabase.from('crew_members').select('crew_id').eq('user_id', actor.userId),
      supabase.from('party_members').select('party_id').eq('user_id', actor.userId),
    ]);
    const myCrews = ((sharedCrew.data || []) as { crew_id: string }[]).map((r) => r.crew_id);
    if (party.crew_id) myCrews.push(party.crew_id);
    const myParties = ((sharedParty.data || []) as { party_id: string }[]).map((r) => r.party_id).filter((id) => id !== partyId);
    const [theirCrews, theirParties] = await Promise.all([
      myCrews.length ? supabase.from('crew_members').select('crew_id').eq('user_id', targetUserId).in('crew_id', myCrews) : Promise.resolve({ data: [], error: null }),
      myParties.length ? supabase.from('party_members').select('party_id').eq('user_id', targetUserId).in('party_id', myParties) : Promise.resolve({ data: [], error: null }),
    ]);
    if (!(theirCrews.data || []).length && !(theirParties.data || []).length) {
      return json({ error: 'You can only add people from your crews or past parties. Share the invite link instead.' }, 403);
    }

    const ins = await supabase.from('party_members').insert({
      party_id: partyId,
      user_id: user.id,
      name: user.name,
      avatar: user.avatar || null,
      wallet_address: user.wallet_address || null,
      role: 'guest',
      status: 'invited',
      nights_together: 1,
    });
    if (ins.error) return json({ error: 'Failed to add this person.' }, 503);
    await logActivity(supabase, partyId, `${party.host_name || actor.name} added ${user.name}`);
    return json({
      success: true,
      partyId,
      added: user.id,
      member: { id: user.id, name: user.name, avatar: user.avatar || '', role: 'guest', status: 'invited', walletAddress: user.wallet_address || undefined },
    });
  } catch {
    return json({ error: 'Party management is temporarily unavailable.' }, 503);
  }
}

// ── DELETE: delete party ───────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const actor = await authenticate(request);
  if (!actor) return json({ error: 'Authentication is required.' }, 401);
  if (rateLimited(actor.userId)) return json({ error: 'Too many changes. Please wait a minute.' }, 429);
  const partyId = new URL(request.url).searchParams.get('partyId');
  if (!partyId) return json({ error: 'partyId is required.' }, 400);

  try {
    const supabase = getServerSupabase();
    const { party, error } = await loadParty(supabase, partyId);
    if (error) return json({ error: 'Party data is temporarily unavailable.' }, 503);
    if (!party) return json({ error: 'Party not found.' }, 404);
    if (party.host_id !== actor.userId) return json({ error: 'Only the host can delete this party.' }, 403);

    // Never orphan group money: the pot must be empty (DB mirror and, when reachable, onchain).
    if (Number(party.pot_balance || 0) > 0) {
      return json({ error: 'POT_NOT_EMPTY', message: 'Refund or withdraw the Party Pot before deleting the party.' }, 409);
    }
    const onchain = await getPartyPotBalanceOnchain(partyId).catch(() => null);
    if (onchain !== null && onchain > 0) {
      return json({ error: 'POT_NOT_EMPTY', message: 'Refund or withdraw the Party Pot before deleting the party.' }, 409);
    }

    await supabase.from('invitations').update({ is_revoked: true }).eq('party_id', partyId);
    const res = await supabase.from('parties').delete().eq('id', partyId).eq('host_id', actor.userId);
    if (res.error) return json({ error: 'Failed to delete the party.' }, 503);
    return json({ success: true, partyId, deleted: true });
  } catch {
    return json({ error: 'Failed to delete the party.' }, 503);
  }
}
