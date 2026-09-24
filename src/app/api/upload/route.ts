import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

// 10MB file size limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'anonymous_client';

  const rateLimit = checkRateLimit(`upload_${clientIp}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'RATE_LIMIT_EXCEEDED', message: 'Too many uploads. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'NO_FILE', message: 'No file provided in request.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_FILE_TYPE',
          message: 'Allowed image formats are JPEG, PNG, WEBP, GIF, and AVIF.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'FILE_TOO_LARGE', message: 'Image cannot exceed 10MB.' },
        { status: 400 }
      );
    }

    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getServerSupabase();
    const { data, error } = await supabase.storage
      .from('partylot-media')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json(
        { success: false, error: 'STORAGE_ERROR', message: error.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('partylot-media')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (err: unknown) {
    console.error('Unexpected upload route error:', err);
    const message = err instanceof Error ? err.message : 'Unknown server upload error.';
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message },
      { status: 500 }
    );
  }
}
