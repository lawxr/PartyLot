-- ==============================================================================
-- PARTYLOT MIGRATION: 20260926_game_sessions.sql
-- Description: Game sessions table for realtime interactive party games
--              (Who's Most Likely, This or That, Crew Trivia).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES public.parties(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('whos-most-likely', 'this-or-that', 'crew-trivia')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_party ON public.game_sessions(party_id);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read on game_sessions" ON public.game_sessions;
CREATE POLICY "Allow all read on game_sessions" ON public.game_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert on game_sessions" ON public.game_sessions;
CREATE POLICY "Allow all insert on game_sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on game_sessions" ON public.game_sessions;
CREATE POLICY "Allow all update on game_sessions" ON public.game_sessions FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
