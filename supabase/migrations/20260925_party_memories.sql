-- ==============================================================================
-- PARTYLOT — Database Schema: Party Shared Album & Memories
-- Creates party_memories table for real photos uploaded by party attendees
-- Enables RLS and Realtime sync
-- ==============================================================================

create table if not exists public.party_memories (
  id text primary key,
  party_id text not null references public.parties(id) on delete cascade,
  image_url text not null,
  caption text,
  uploaded_by_id text references public.users(id) on delete set null,
  uploaded_by_name text not null,
  uploaded_by_avatar text,
  created_at timestamptz not null default now()
);

alter table public.party_memories enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'party_memories' and policyname = 'Allow all read on party_memories') then
    create policy "Allow all read on party_memories" on public.party_memories for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'party_memories' and policyname = 'Allow all insert on party_memories') then
    create policy "Allow all insert on party_memories" on public.party_memories for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'party_memories' and policyname = 'Allow all update on party_memories') then
    create policy "Allow all update on party_memories" on public.party_memories for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'party_memories' and policyname = 'Allow all delete on party_memories') then
    create policy "Allow all delete on party_memories" on public.party_memories for delete using (true);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'party_memories') then
      alter publication supabase_realtime add table public.party_memories;
    end if;
  end if;
end $$;
