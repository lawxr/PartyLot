-- ==============================================================================
-- PARTYLOT MIGRATION: 20261008_grant_update_user_profile_rpc.sql
-- Description: Grant EXECUTE on update_user_profile to anon and authenticated roles.
--              Since update_user_profile is a SECURITY DEFINER function with strict
--              internal validation, granting execute allows local dev environments
--              to persist profiles even if SUPABASE_SERVICE_ROLE_KEY is not configured.
-- ==============================================================================

DO $$
BEGIN
  -- Grant execute privilege on update_user_profile to anon, authenticated and service_role
  GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text, text, text) TO anon, authenticated, service_role;
EXCEPTION
  WHEN undefined_function THEN
    RAISE NOTICE 'Function public.update_user_profile(text, text, text, text) does not exist yet.';
END $$;
