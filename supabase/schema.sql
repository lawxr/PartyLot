-- PartyLot Database Schema (Supabase PostgreSQL)
-- Execute this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profiles)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  avatar TEXT,
  cover_image TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  instagram TEXT,
  twitter TEXT,
  wallet_address TEXT UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  gatherings_count INTEGER DEFAULT 0,
  games_count INTEGER DEFAULT 0,
  people_count INTEGER DEFAULT 0,
  settlements_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  show_nights BOOLEAN DEFAULT true,
  show_crews BOOLEAN DEFAULT true,
  allow_follows BOOLEAN DEFAULT true,
  notify_invites BOOLEAN DEFAULT true,
  notify_finances BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  host_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  max_guests INTEGER DEFAULT 50,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  pot_balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Party members
CREATE TABLE IF NOT EXISTS party_members (
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'guest' CHECK (role IN ('host', 'guest')),
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'going', 'maybe', 'declined')),
  nights_together INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (party_id, user_id)
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_by_id TEXT REFERENCES users(id),
  paid_by_name TEXT NOT NULL,
  split_between_ids TEXT[] NOT NULL,
  category TEXT DEFAULT 'general',
  is_settled BOOLEAN DEFAULT false,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pot transactions
CREATE TABLE IF NOT EXISTS pot_transactions (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'expense', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  from_user_id TEXT REFERENCES users(id),
  from_name TEXT,
  description TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 50,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crews (groups)
CREATE TABLE IF NOT EXISTS crews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🎉',
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew members
CREATE TABLE IF NOT EXISTS crew_members (
  crew_id TEXT REFERENCES crews(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (crew_id, user_id)
);

-- Activities (feed)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  party_title TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Party memories (photos/videos)
CREATE TABLE IF NOT EXISTS party_memories (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'photo' CHECK (type IN ('photo', 'video')),
  uploaded_by_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social follows
CREATE TABLE IF NOT EXISTS social_follows (
  follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  eas_attestation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parties_host ON parties(host_id);
CREATE INDEX IF NOT EXISTS idx_parties_date ON parties(date);
CREATE INDEX IF NOT EXISTS idx_party_members_user ON party_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_party ON expenses(party_id);
CREATE INDEX IF NOT EXISTS idx_pot_transactions_party ON pot_transactions(party_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pot_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;

-- Public read for most tables (adjust based on your security needs)
CREATE POLICY "Public users read" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Public parties read" ON parties FOR SELECT USING (true);
CREATE POLICY "Host can modify party" ON parties FOR ALL USING (auth.uid()::text = host_id);

CREATE POLICY "Members can read party members" ON party_members FOR SELECT USING (true);
CREATE POLICY "Members can update own status" ON party_members FOR UPDATE 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Members can read expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated can add expenses" ON expenses FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public pot transactions read" ON pot_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated can add transactions" ON pot_transactions FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public invitations validate" ON invitations FOR SELECT USING (true);

CREATE POLICY "Public crews read" ON crews FOR SELECT USING (true);
CREATE POLICY "Public crew members read" ON crew_members FOR SELECT USING (true);

CREATE POLICY "Public activities read" ON activities FOR SELECT USING (true);

CREATE POLICY "Public memories read" ON party_memories FOR SELECT USING (true);
CREATE POLICY "Authenticated can upload memories" ON party_memories FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public follows read" ON social_follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON social_follows FOR INSERT 
  WITH CHECK (auth.uid()::text = follower_id);

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE party_members;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE pot_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{option: string, votes: number}]
  created_by_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table (for Who's Most Likely, This or That, Trivia)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL CHECK (game_type IN ('whos-most-likely', 'this-or-that', 'crew-trivia')),
  questions JSONB NOT NULL, -- [{id, question, votes: {userId: count}, answer?: string}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polls_party ON polls(party_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_party ON game_sessions(party_id);

-- RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public polls read" ON polls FOR SELECT USING (true);
CREATE POLICY "Public game_sessions read" ON game_sessions FOR SELECT USING (true);

-- Authenticated users can insert/update
CREATE POLICY "Authenticated users insert polls" ON polls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users update polls" ON polls FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users insert game_sessions" ON game_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users update game_sessions" ON game_sessions FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
