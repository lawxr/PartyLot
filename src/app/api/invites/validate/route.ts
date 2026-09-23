import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code || !code.trim()) {
    return NextResponse.json(
      { valid: false, error: 'Invite code is required.' },
      { status: 400 }
    );
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc('validate_invite_code', {
      p_code: code.trim(),
    });

    if (error) {
      console.error('Supabase validate_invite_code RPC error:', error);
      return NextResponse.json(
        { valid: false, error: 'Database service error validating invite.' },
        { status: 500 }
      );
    }

    if (!data || !data.valid) {
      return NextResponse.json(
        { valid: false, error: data?.error || 'Invalid or expired invite code.' },
        { status: 200 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('Unexpected error validating invite code:', err);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invite code.' },
      { status: 500 }
    );
  }
}
