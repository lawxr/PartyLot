-- ==============================================================================
-- PARTYLOT MIGRATION: 20261006_pr08_deny_by_default_client_access.sql
-- Description: Enforce strict deny-by-default access for client roles (anon, authenticated)
--              across all private group tables and unsafe RPC functions.
--              Legitimate data access is mediated entirely by the verified-Privy
--              server route handlers running with service_role.
-- ==============================================================================

-- 1. Drop all remaining permissive policies from historical migrations
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'parties', 'party_members', 'invitations', 'expenses', 'pot_transactions',
        'tasks', 'polls', 'activities', 'party_memories', 'game_sessions',
        'crews', 'crew_members'
      )
      AND (
        policyname ILIKE '%allow all%'
        OR policyname ILIKE 'public read%'
        OR policyname ILIKE '%update%'
        OR policyname ILIKE '%insert%'
        OR policyname ILIKE '%delete%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 2. Explicitly drop named historical policies to ensure idempotency across all environments
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('parties', 'Public read parties'),
      ('parties', 'Host update parties'),
      ('parties', 'Allow all read on parties'),
      ('parties', 'Allow all insert on parties'),
      ('parties', 'Allow all update on parties'),
      ('party_members', 'Public read party_members'),
      ('party_members', 'Allow all read on party_members'),
      ('party_members', 'Allow all insert on party_members'),
      ('party_members', 'Allow all update on party_members'),
      ('invitations', 'Allow all read on invitations'),
      ('invitations', 'Allow all insert on invitations'),
      ('invitations', 'Allow all update on invitations'),
      ('expenses', 'Public read expenses'),
      ('expenses', 'Allow all read on expenses'),
      ('expenses', 'Allow all insert on expenses'),
      ('expenses', 'Allow all update on expenses'),
      ('pot_transactions', 'Allow all read on pot_transactions'),
      ('pot_transactions', 'Allow all insert on pot_transactions'),
      ('pot_transactions', 'Allow all update on pot_transactions'),
      ('tasks', 'Public read tasks'),
      ('tasks', 'Allow all read on tasks'),
      ('tasks', 'Allow all insert on tasks'),
      ('tasks', 'Allow all update on tasks'),
      ('tasks', 'Allow all delete on tasks'),
      ('polls', 'Public read polls'),
      ('polls', 'Allow all read on polls'),
      ('polls', 'Allow all insert on polls'),
      ('polls', 'Allow all update on polls'),
      ('activities', 'Allow all read on activities'),
      ('activities', 'Allow all insert on activities'),
      ('activities', 'Allow all update on activities'),
      ('activities', 'Allow all insert/update on activities'),
      ('party_memories', 'Allow all read on party_memories'),
      ('party_memories', 'Allow all insert on party_memories'),
      ('party_memories', 'Allow all update on party_memories'),
      ('party_memories', 'Allow all delete on party_memories'),
      ('game_sessions', 'Allow all read on game_sessions'),
      ('game_sessions', 'Allow all insert on game_sessions'),
      ('game_sessions', 'Allow all update on game_sessions'),
      ('crews', 'Public read crews'),
      ('crews', 'Allow all read on crews'),
      ('crews', 'Allow all insert on crews'),
      ('crews', 'Allow all update on crews'),
      ('crew_members', 'Public read crew_members'),
      ('crew_members', 'Allow all read on crew_members'),
      ('crew_members', 'Allow all insert on crew_members'),
      ('crew_members', 'Allow all update on crew_members')
    ) AS t(tbl, pol)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.pol, rec.tbl);
  END LOOP;
END $$;

-- 3. Enable and FORCE Row Level Security on all private tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'parties', 'party_members', 'invitations', 'expenses', 'pot_transactions',
    'tasks', 'polls', 'activities', 'party_memories', 'game_sessions',
    'crews', 'crew_members'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- 4. Establish explicit restrictive deny-all policies for client roles (anon, authenticated)
-- Service role bypasses RLS and maintains full access for server-verified API endpoints.
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'parties', 'party_members', 'invitations', 'expenses', 'pot_transactions',
    'tasks', 'polls', 'activities', 'party_memories', 'game_sessions',
    'crews', 'crew_members'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "partylot deny client access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "partylot deny client access" ON public.%I ' ||
      'AS RESTRICTIVE FOR ALL TO anon, authenticated ' ||
      'USING (false) WITH CHECK (false)',
      tbl
    );
  END LOOP;
END $$;

-- 5. Revoke direct table manipulation privileges from client roles
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'parties', 'party_members', 'invitations', 'expenses', 'pot_transactions',
    'tasks', 'polls', 'activities', 'party_memories', 'game_sessions',
    'crews', 'crew_members'
  ]) LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', tbl);
  END LOOP;
END $$;

-- 6. Lock down Security Definer RPC functions: accessible ONLY by service_role
DO $$
DECLARE
  func_record record;
BEGIN
  FOR func_record IN
    SELECT proname, oid::regprocedure AS regproc
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN ('validate_invite_code', 'join_party_with_invite', 'update_user_profile')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', func_record.regproc);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', func_record.regproc);
  END LOOP;
END $$;

-- 7. Comments documenting the architecture
COMMENT ON POLICY "partylot deny client access" ON public.parties IS
  'Deny-by-default for anon and authenticated clients. All data access must pass through Privy-verified server routes.';
COMMENT ON POLICY "partylot deny client access" ON public.expenses IS
  'Expenses are confidential group data; direct browser queries are denied.';
COMMENT ON POLICY "partylot deny client access" ON public.party_memories IS
  'Party memories and photos are restricted to verified group members via authenticated server API.';
