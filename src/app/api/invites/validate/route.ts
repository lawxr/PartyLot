import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function GET(request: NextRequest) {
  // 1. Rate limiting against brute-force enumeration (Cloudflare WAF / API Shield pattern)
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous_client';

  const rateLimit = checkRateLimit(`validate_code_${clientIp}`, {
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { valid: false, error: 'Too many verification attempts. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code || !code.trim()) {
    return NextResponse.json(
      { valid: false, error: 'Invite code is required.' },
      { status: 400 }
    );
  }

  const cleanCode = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{4,10}$/.test(cleanCode)) {
    return NextResponse.json(
      { valid: false, error: 'Invalid invite code format.' },
      { status: 400 }
    );
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc('validate_invite_code', {
      p_code: cleanCode,
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

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (err) {
    console.error('Unexpected error validating invite code:', err);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate invite code.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = body?.code;

    const url = new URL(request.url);
    if (code) {
      url.searchParams.set('code', code);
    }

    const modifiedRequest = new NextRequest(url.toString(), {
      headers: request.headers,
    });

    return GET(modifiedRequest);
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid JSON body for invite validation.' },
      { status: 400 }
    );
  }
}
