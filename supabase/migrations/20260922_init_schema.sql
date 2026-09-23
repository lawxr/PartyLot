-- ==============================================================================
-- PARTYLOT — Database Schema Initialization (Supabase / PostgreSQL)
-- Reflects PRODUCT.md Specifications:
--   * Persistent Crews & Gatherings
--   * Secure Server-Side Invitations (8F4K code mapping, expiration, usage limits)
--   * Realtime Multi-Device Sync for Members, Party Pot, Splits & Polls
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "pgcrypto";

-- 2. Users Table
create table if not exists public.users (
  id text primary key, -- Privy DID or UUID
  name text not null,
  handle text not null,
  avatar text,
  wallet_address text,
  email text,
  gatherings_count int not null default 0,
  games_count int not null default 0,
  people_count int not null default 0,
  settlements_count int not null default 0,
  balance numeric(12, 2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Crews Table (Persistent Private Social Groups)
create table if not exists public.crews (
  id text primary key,
  name text not null,
  cover_image text,
  owner_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4. Crew Members Junction
create table if not exists public.crew_members (
  id uuid primary key default gen_random_uuid(),
  crew_id text not null references public.crews(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null default 'member', -- owner, admin, member
  joined_at timestamptz not null default now(),
  unique(crew_id, user_id)
);

-- 5. Parties Table (Specific Gatherings linked to a Crew)
create table if not exists public.parties (
  id text primary key,
  crew_id text references public.crews(id) on delete set null,
  code text not null unique, -- Human-readable 4-character invite code (e.g. 8F4K)
  title text not null,
  date text not null,
  time text not null,
  location text not null,
  description text,
  cover_image text,
  host_id text references public.users(id) on delete set null,
  host_name text not null default 'Host',
  pot_balance numeric(12, 2) not null default 0.00,
  status text not null default 'upcoming', -- upcoming, live, past
  created_at timestamptz not null default now()
);

-- 6. Party Members Junction (Live Attendees)
create table if not exists public.party_members (
  id uuid primary key default gen_random_uuid(),
  party_id text not null references public.parties(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  name text not null,
  avatar text,
  role text not null default 'guest', -- host, guest
  status text not null default 'going', -- going, maybe, invited
  wallet_address text,
  nights_together int not null default 1,
  joined_at timestamptz not null default now(),
  unique(party_id, user_id)
);

-- 7. Invitations Table (PRODUCT.md Section 8.1 & 14: Server-Side Invite Primitive)
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  party_id text not null references public.parties(id) on delete cascade,
  code text not null,
  max_uses int not null default 50,
  used_count int not null default 0,
  expires_at timestamptz not null default (now() + interval '7 days'),
  is_revoked boolean not null default false,
  created_at timestamptz not null default now()
);

-- 8. Expenses Table (Split the Damage)
create table if not exists public.expenses (
  id text primary key,
  party_id text not null references public.parties(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null,
  paid_by_id text references public.users(id) on delete set null,
  paid_by_name text not null,
  split_between_ids jsonb not null default '[]'::jsonb,
  is_settled boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. Party Pot Transactions Table (Deposits, Spendings, Rewards)
create table if not exists public.pot_transactions (
  id text primary key,
  party_id text not null references public.parties(id) on delete cascade,
  user_id text references public.users(id) on delete set null,
  user_name text not null,
  type text not null, -- 'deposit' | 'spend' | 'reward' | 'reimbursement'
  amount numeric(12, 2) not null,
  description text,
  tx_hash text,
  created_at timestamptz not null default now()
);

-- 10. Polls Table (Lightweight Group Governance)
create table if not exists public.polls (
  id text primary key,
  party_id text not null references public.parties(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  votes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 11. Activity Stream Table
create table if not exists public.activities (
  id text primary key,
  party_id text not null references public.parties(id) on delete cascade,
  type text not null, -- 'join' | 'deposit' | 'expense' | 'game' | 'poll'
  text text not null,
  time text not null default 'Just now',
  avatar text,
  created_at timestamptz not null default now()
);

-- 12. Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.invitations enable row level security;
alter table public.expenses enable row level security;
alter table public.pot_transactions enable row level security;
alter table public.polls enable row level security;
alter table public.activities enable row level security;

-- 13. Public / Anon Hackathon Policies (Permissive read and write for rapid multi-device testing)
create policy "Allow all read on users" on public.users for select using (true);
create policy "Allow all insert/update on users" on public.users for all using (true);

create policy "Allow all read on crews" on public.crews for select using (true);
create policy "Allow all insert/update on crews" on public.crews for all using (true);

create policy "Allow all read on crew_members" on public.crew_members for select using (true);
create policy "Allow all insert/update on crew_members" on public.crew_members for all using (true);

create policy "Allow all read on parties" on public.parties for select using (true);
create policy "Allow all insert/update on parties" on public.parties for all using (true);

create policy "Allow all read on party_members" on public.party_members for select using (true);
create policy "Allow all insert/update on party_members" on public.party_members for all using (true);

create policy "Allow all read on invitations" on public.invitations for select using (true);
create policy "Allow all insert/update on invitations" on public.invitations for all using (true);

create policy "Allow all read on expenses" on public.expenses for select using (true);
create policy "Allow all insert/update on expenses" on public.expenses for all using (true);

create policy "Allow all read on pot_transactions" on public.pot_transactions for select using (true);
create policy "Allow all insert/update on pot_transactions" on public.pot_transactions for all using (true);

create policy "Allow all read on polls" on public.polls for select using (true);
create policy "Allow all insert/update on polls" on public.polls for all using (true);

create policy "Allow all read on activities" on public.activities for select using (true);
create policy "Allow all insert/update on activities" on public.activities for all using (true);

-- 14. Enable Supabase Realtime Replication Publication
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.parties;
alter publication supabase_realtime add table public.party_members;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.pot_transactions;
alter publication supabase_realtime add table public.polls;
