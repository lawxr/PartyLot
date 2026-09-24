-- ==============================================================================
-- PARTYLOT — 20260924: Restore Client Access Policies & Storage Configuration
-- ==============================================================================

-- 1. Create partylot-media bucket for avatars, party covers, and crew memories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'partylot-media',
  'partylot-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public media access') THEN
    CREATE POLICY "Public media access" ON storage.objects FOR SELECT USING (bucket_id = 'partylot-media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow media uploads') THEN
    CREATE POLICY "Allow media uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'partylot-media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow media updates') THEN
    CREATE POLICY "Allow media updates" ON storage.objects FOR UPDATE USING (bucket_id = 'partylot-media');
  END IF;
END $$;

-- 3. Restore client access policies on tables so browser client can read/write live parties
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users', 'crews', 'crew_members', 'parties', 'party_members', 'invitations',
    'expenses', 'pot_transactions', 'polls', 'activities', 'tasks'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "partylot closed client access" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all read on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all read on %I" ON public.%I FOR SELECT USING (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all insert on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all insert on %I" ON public.%I FOR INSERT WITH CHECK (true)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all update on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow all update on %I" ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;
