-- This app does not yet have a verified Supabase identity mapping for Privy.
-- Close the permissive prototype policies until an authenticated server-side
-- join/persistence contract exists. The service_role remains subject to its
-- normal RLS bypass; anon/authenticated client access is denied intentionally.
do $$
declare
  policy_row record;
  table_name text;
begin
  for policy_row in
    select * from (values
      ('users', 'Allow all read on users'),
      ('users', 'Allow all insert/update on users'),
      ('crews', 'Allow all read on crews'),
      ('crews', 'Allow all insert/update on crews'),
      ('crew_members', 'Allow all read on crew_members'),
      ('crew_members', 'Allow all insert/update on crew_members'),
      ('parties', 'Allow all read on parties'),
      ('parties', 'Allow all insert/update on parties'),
      ('party_members', 'Allow all read on party_members'),
      ('party_members', 'Allow all insert/update on party_members'),
      ('invitations', 'Allow all read on invitations'),
      ('invitations', 'Allow all insert/update on invitations'),
      ('expenses', 'Allow all read on expenses'),
      ('expenses', 'Allow all insert/update on expenses'),
      ('pot_transactions', 'Allow all read on pot_transactions'),
      ('pot_transactions', 'Allow all insert/update on pot_transactions'),
      ('polls', 'Allow all read on polls'),
      ('polls', 'Allow all insert/update on polls'),
      ('activities', 'Allow all read on activities'),
      ('activities', 'Allow all insert/update on activities'),
      ('tasks', 'Allow all read on tasks'),
      ('tasks', 'Allow all insert/update on tasks'),
      ('tasks', 'Allow all delete on tasks')
    ) as policies(table_name, policy_name)
  loop
    execute format('drop policy if exists %I on public.%I', policy_row.policy_name, policy_row.table_name);
  end loop;

  foreach table_name in array array[
    'users', 'crews', 'crew_members', 'parties', 'party_members', 'invitations',
    'expenses', 'pot_transactions', 'polls', 'activities', 'tasks'
  ] loop
    execute format(
      'create policy "partylot closed client access" on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;

comment on policy "partylot closed client access" on public.invitations is
  'Closed by default until server-side authentication, identity mapping, and atomic invite-join RPC are implemented.';
