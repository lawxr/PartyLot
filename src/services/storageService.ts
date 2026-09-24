import { getSupabase } from '@/lib/supabase/client';

/**
 * Uploads an image file to Supabase Storage and returns the public CDN URL.
 * Automatically tries the server-side /api/upload endpoint first, falling back
 * to direct client-side Supabase storage upload if available.
 */
export async function uploadImageFile(file: File, folder: string = 'uploads'): Promise<string> {
  // Validate basic constraints client-side
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, WEBP, GIF).');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be less than 10MB.');
  }

  // 1. Try server-side upload endpoint
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('API upload endpoint fallback:', err);
  }

  // 2. Direct client-side Supabase Storage fallback
  const supabase = getSupabase();
  if (supabase) {
    try {
      const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'uploads';
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${safeExt}`;

      const { data, error } = await supabase.storage
        .from('partylot-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from('partylot-media')
          .getPublicUrl(data.path);
        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (directErr) {
      console.warn('Direct Supabase upload error:', directErr);
    }
  }

  // 3. Offline / Demo fixture fallback: Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}
