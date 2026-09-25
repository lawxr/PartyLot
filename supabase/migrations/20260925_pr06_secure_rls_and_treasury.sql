-- ==============================================================================
-- PARTYLOT MIGRATION: 20260925_pr06_secure_rls_and_treasury.sql
-- Description: Harden Supabase RLS policies and RPC execution permissions
--              following Cloudflare Security Audit findings.
-- ==============================================================================

-- 1. Restrict financial mutations on pot_transactions to service_role (server-only)
-- Anonymous and public clients may READ transactions for realtime view, but cannot forge them.
DROP POLICY IF EXISTS "Allow all insert on pot_transactions" ON public.pot_transactions;
DROP POLICY IF EXISTS "Allow all update on pot_transactions" ON public.pot_transactions;

-- 2. Restrict invitations table mutations to service_role
-- Prevents unauthenticated users from generating or modifying party invites directly.
DROP POLICY IF EXISTS "Allow all insert on invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow all update on invitations" ON public.invitations;

-- 3. Prevent arbitrary overwriting of media assets in Storage
-- Media assets in 'partylot-media' are immutable once uploaded; drops public overwrite.
DROP POLICY IF EXISTS "Allow media updates" ON storage.objects;

-- 4. Revoke direct public execution on SECURITY DEFINER profile update RPC
-- Clients must route through authenticated Next.js route (/api/users/profile) which
-- verifies cryptographic Privy Bearer tokens before executing with service_role.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_user_profile'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.update_user_profile(text, text, text, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text, text, text) TO service_role;
  END IF;
END $$;
