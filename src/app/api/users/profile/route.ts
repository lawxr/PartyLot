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

  let body: { name?: string; handle?: string; avatar?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const { name, handle, avatar } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { success: false, error: 'BAD_REQUEST', message: 'Name is required.' },
      { status: 400 }
    );
  }

  // 1. Verify user identity via Privy token
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

  const cleanHandle = handle && typeof handle === 'string'
    ? handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`
    : verifiedProfile.handle;

  // 2. Execute update_user_profile RPC in Supabase
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc('update_user_profile', {
      p_user_id: verifiedProfile.userId,
      p_name: name.trim(),
      p_handle: cleanHandle,
      p_avatar: avatar || null,
    });

    if (error) {
      console.error('Supabase update_user_profile error:', error);
      return NextResponse.json(
        { success: false, error: 'DATABASE_ERROR', message: 'Failed to update user profile.' },
        { status: 500 }
      );
    }

    if (data && data.success === false) {
      const statusCode = data.error === 'HANDLE_ALREADY_EXISTS' ? 409 : 400;
      return NextResponse.json(data, { status: statusCode });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Unexpected error updating user profile:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Unexpected server error updating user profile.' },
      { status: 500 }
    );
  }
}
