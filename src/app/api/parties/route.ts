import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { generatePartyCode } from '@/services/party';
import { registerPartyOnchain } from '@/services/treasury';
import type { Party } from '@/types';

export async function POST(request: NextRequest) {
  // 1. Rate limiting against party creation spam
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous_client';

  const rateLimit = checkRateLimit(`party_create_${clientIp}`, {
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many party creation requests. Please wait a minute.' },
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
    walletAddress: string | null;
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
          walletAddress: verified.walletAddress,
        };
      } catch (authErr) {
        console.warn('Privy token verification failed in party creation:', authErr);
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
      { success: false, error: 'UNAUTHORIZED', message: 'Authentication is required to create a party.' },
      { status: 401 }
    );
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Party title is required.' },
      { status: 400 }
    );
  }

  const partyId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `party-${Date.now()}`;
  const code = typeof body.code === 'string' && body.code ? body.code.toUpperCase() : generatePartyCode();
  const date = typeof body.date === 'string' ? body.date : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = typeof body.time === 'string' ? body.time : '8:00 PM';
  const location = typeof body.location === 'string' ? body.location : 'Secret Location';
  const description = typeof body.description === 'string' ? body.description : '';
  const coverImage = typeof body.coverImage === 'string' && body.coverImage
    ? body.coverImage
    : 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80';
  if (body.crewId !== undefined && body.crewId !== null && (typeof body.crewId !== 'string' || !body.crewId.trim())) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Valid crewId is required when provided.' },
      { status: 400 }
    );
  }
  const crewId = typeof body.crewId === 'string' ? body.crewId.trim() : null;

  try {
    const supabase = getServerSupabase();

    // 1. Validate crew membership before writing any party data.
    let validCrewId: string | null = null;
    if (crewId) {
      const { data: crewData, error: crewErr } = await supabase
        .from('crews')
        .select('id, owner_id')
        .eq('id', crewId)
        .maybeSingle();
      if (crewErr) {
        return NextResponse.json(
          { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Unable to verify crew membership.' },
          { status: 503 }
        );
      }
      if (!crewData?.id) {
        return NextResponse.json(
          { success: false, error: 'NOT_FOUND', message: 'Crew not found.' },
          { status: 404 }
        );
      }

      if (crewData.owner_id !== verifiedUser.userId) {
        const { data: crewMembership, error: membershipErr } = await supabase
          .from('crew_members')
          .select('user_id')
          .eq('crew_id', crewId)
          .eq('user_id', verifiedUser.userId)
          .maybeSingle();
        if (membershipErr) {
          return NextResponse.json(
            { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Unable to verify crew membership.' },
            { status: 503 }
          );
        }
        if (!crewMembership) {
          return NextResponse.json(
            { success: false, error: 'FORBIDDEN', message: 'You must belong to this crew to create a party for it.' },
            { status: 403 }
          );
        }
      }
      validCrewId = crewData.id;
    }

    // A preflight avoids profile writes for an already-used ID; the insert below remains
    // the atomic create-only boundary if another request races this lookup.
    const { data: existingParty, error: existingPartyErr } = await supabase
      .from('parties')
      .select('id')
      .eq('id', partyId)
      .maybeSingle();
    if (existingPartyErr) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Unable to verify party availability.' },
        { status: 503 }
      );
    }
    if (existingParty) {
      return NextResponse.json(
        { success: false, error: 'CONFLICT', message: 'A party with this ID already exists.' },
        { status: 409 }
      );
    }

    // 2. Ensure the verified host profile exists. No caller-provided host fields are used.
    const { error: userErr } = await supabase.from('users').upsert(
      {
        id: verifiedUser.userId,
        name: verifiedUser.name,
        handle: verifiedUser.handle,
        avatar: verifiedUser.avatar,
        wallet_address: verifiedUser.walletAddress,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (userErr) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Unable to prepare the verified host profile.' },
        { status: 503 }
      );
    }

    // 3. Insert only: a party ID can never become an update selector.
    const { error: partyErr } = await supabase.from('parties').insert(
      {
        id: partyId,
        crew_id: validCrewId,
        code,
        title,
        date,
        time,
        location,
        description,
        cover_image: coverImage,
        host_id: verifiedUser.userId,
        host_name: verifiedUser.name,
        pot_balance: 0,
        status: 'live',
      },
    );

    if (partyErr) {
      console.error('Supabase party insert error:', partyErr);
      if ((partyErr as { code?: string }).code === '23505') {
        return NextResponse.json(
          { success: false, error: 'CONFLICT', message: 'A party with this ID already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'DATABASE_UNAVAILABLE', message: 'Failed to create party in database.' },
        { status: 503 }
      );
    }

    // 4. Insert the verified host as the primary member.
    const { error: memberErr } = await supabase.from('party_members').insert(
      {
        party_id: partyId,
        user_id: verifiedUser.userId,
        name: verifiedUser.name,
        avatar: verifiedUser.avatar,
        role: 'host',
        status: 'going',
        nights_together: 1,
      },
    );
    if (memberErr) throw memberErr;

    // 5. Create server-side invitation
    const { error: invitationErr } = await supabase.from('invitations').insert({
      party_id: partyId,
      code,
      max_uses: 50,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_revoked: false,
    });
    if (invitationErr) throw invitationErr;

    // 6. Record creation activity
    let activityErr: unknown = null;
    try {
      const result = await supabase.from('activities').insert({
        id: `act-${Date.now()}`,
        party_id: partyId,
        type: 'join',
        text: `${verifiedUser.name} created the party: ${title}`,
        time: 'Just now',
        avatar: verifiedUser.avatar,
      });
      activityErr = result.error;
    } catch (err) {
      activityErr = err;
    }
    if (activityErr) console.error('Supabase party activity insert error:', activityErr);

    // 7. Background onchain treasury registration on Monad Testnet
    registerPartyOnchain(partyId, verifiedUser.walletAddress || undefined).catch((onchainErr) => {
      console.warn('Background onchain treasury registration notice:', onchainErr);
    });

    const createdParty: Party = {
      id: partyId,
      crewId: validCrewId || undefined,
      code,
      title,
      date,
      time,
      location,
      description,
      coverImage,
      hostId: verifiedUser.userId,
      hostName: verifiedUser.name,
      members: [
        {
          id: verifiedUser.userId,
          name: verifiedUser.name,
          avatar: verifiedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          role: 'host',
          status: 'going',
          nightsTogether: 1,
          walletAddress: verifiedUser.walletAddress || undefined,
        },
      ],
      potBalance: 0,
      createdAt: new Date().toISOString(),
      status: 'live',
    };

    return NextResponse.json({
      success: true,
      party: createdParty,
      ...(activityErr ? { warning: 'Party created, but activity could not be recorded.' } : {}),
    }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error creating party:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Unexpected server error while creating party.' },
      { status: 500 }
    );
  }
}
