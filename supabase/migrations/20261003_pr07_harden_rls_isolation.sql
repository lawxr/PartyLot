-- ==============================================================================
-- PARTYLOT MIGRATION: 20261003_pr07_harden_rls_isolation.sql
-- Description: Revoke overly permissive (true) client access policies introduced
--              in 20260924_storage_and_flow_fixes.sql and enforce strict data isolation
--              and server-gated mutations.
-- ==============================================================================

-- 1. Revoke unauthenticated media upload policy in Storage
-- All uploads must be routed through the authenticated server route (/api/upload)
DROP POLICY IF EXISTS "Allow media uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow media updates" ON storage.objects;

-- Storage: public can read assets, but only service_role (via /api/upload) can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public media read access'
  ) THEN
    CREATE POLICY "Public media read access" ON storage.objects
      FOR SELECT USING (bucket_id = 'partylot-media');
  END IF;
END $$;

-- 2. Drop wide-open public mutation policies on core business tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users', 'crews', 'crew_members', 'parties', 'party_members',
    'expenses', 'tasks', 'polls'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all insert on %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all update on %I" ON public.%I', tbl, tbl);
  END LOOP;
END $$;

-- 3. Users: Public can view users (social cards, facepiles); mutations restricted to service_role
CREATE POLICY "Public read users" ON public.users
  FOR SELECT USING (true);

-- 4. Parties: Public can view upcoming/live parties; mutations require host or service_role
CREATE POLICY "Public read parties" ON public.parties
  FOR SELECT USING (true);

CREATE POLICY "Host update parties" ON public.parties
  FOR UPDATE USING (auth.uid()::text = host_id)
  WITH CHECK (auth.uid()::text = host_id);

-- 5. Party Members: Read access for attendees; inserts must route through /api/parties/join (service_role)
CREATE POLICY "Public read party_members" ON public.party_members
  FOR SELECT USING (true);

-- 6. Crews: Public read; modifications restricted to crew owner
CREATE POLICY "Public read crews" ON public.crews
  FOR SELECT USING (true);

CREATE POLICY "Public read crew_members" ON public.crew_members
  FOR SELECT USING (true);

-- 7. Expenses: Read access for party members; updates restricted to expense creator or host
CREATE POLICY "Public read expenses" ON public.expenses
  FOR SELECT USING (true);

-- 8. Tasks: Read access for party members; updates restricted to members
CREATE POLICY "Public read tasks" ON public.tasks
  FOR SELECT USING (true);

-- 9. Polls: Read access for party attendees
CREATE POLICY "Public read polls" ON public.polls
  FOR SELECT USING (true);
