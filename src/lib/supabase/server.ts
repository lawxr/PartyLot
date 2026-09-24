import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverSupabaseInstance: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client.
 * Prioritizes SUPABASE_SERVICE_ROLE_KEY for admin/service-role access,
 * falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY for public/security-definer calls.
 */
export function getServerSupabase(): SupabaseClient {
  if (serverSupabaseInstance) {
    return serverSupabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables are missing on the server.');
  }

  serverSupabaseInstance = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverSupabaseInstance;
}
