import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { verifyPrivyToken } from '@/lib/auth/serverPrivy';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header.' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Empty bearer token.' },
      { status: 401 }
    );
  }

  let body: { inviteCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { inviteCode } = body;
  if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
    return NextResponse.json(
      { success: false, error: 'INVALID_INVITE', message: 'An invite code is required to join a party.' },
      { status: 400 }
    );
  }

  // 1. Authenticate user identity via Privy cryptographic verification
  let verifiedProfile;
  try {
    verifiedProfile = await verifyPrivyToken(token);
  } catch (authErr) {
    console.warn('Privy token verification failed:', authErr);
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired authentication token.' },
      { status: 401 }
    );
  }

  // 2. Execute atomic join RPC in Supabase Postgres
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc('join_party_with_invite', {
      p_user_id: verifiedProfile.userId,
      p_user_name: verifiedProfile.name,
      p_user_handle: verifiedProfile.handle,
      p_user_avatar: verifiedProfile.avatar,
      p_user_wallet: verifiedProfile.walletAddress,
      p_invite_code: inviteCode.trim().toUpperCase(),
    });

    if (error) {
      console.error('Supabase join_party_with_invite RPC error:', error);
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: 'Failed to process party join transaction.' },
        { status: 500 }
      );
    }

    if (!data || !data.success) {
      const statusCode =
        data?.error === 'INVITE_NOT_FOUND' ? 404 :
        data?.error === 'INVITE_EXPIRED' ? 410 :
        data?.error === 'INVITE_MAX_USES_REACHED' ? 409 : 400;

      return NextResponse.json(data || { success: false, error: 'JOIN_FAILED' }, { status: statusCode });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Unexpected error joining party:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Unexpected server error while joining party.' },
      { status: 500 }
    );
  }
}
