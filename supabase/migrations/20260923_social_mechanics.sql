-- ==============================================================================
-- PARTYLOT — Database Schema: Phase 4 Social Mechanics & Bounties
-- Adds tasks table for lightweight party contribution bounties (PRODUCT.md Section 8.6)
-- Configures RLS policies and adds to Realtime publication
-- ==============================================================================

create table if not exists public.tasks (
  id text primary key,
  party_id text not null references public.parties(id) on delete cascade,
  title text not null,
  reward_amount numeric(12, 2) not null default 0.00,
  status text not null default 'open', -- 'open' | 'claimed' | 'completed' | 'verified'
  claimed_by_id text references public.users(id) on delete set null,
  claimed_by_name text,
  claimed_by_avatar text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Permissive hackathon policies for rapid multi-device testing
create policy "Allow all read on tasks" on public.tasks for select using (true);
create policy "Allow all insert/update on tasks" on public.tasks for all using (true);
create policy "Allow all delete on tasks" on public.tasks for delete using (true);

-- Add to Supabase Realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.tasks;
  end if;
end $$;
