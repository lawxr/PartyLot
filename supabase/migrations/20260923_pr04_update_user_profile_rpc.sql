-- ==============================================================================
-- PARTYLOT — PR-04: Atomic User Profile Update RPC
-- ==============================================================================

create or replace function public.update_user_profile(
  p_user_id text,
  p_name text,
  p_handle text,
  p_avatar text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
begin
  insert into users (
    id, name, handle, avatar, updated_at
  ) values (
    p_user_id,
    coalesce(nullif(p_name, ''), 'PartyMember'),
    coalesce(nullif(p_handle, ''), '@partymember'),
    p_avatar,
    now()
  )
  on conflict (id) do update set
    name = coalesce(nullif(excluded.name, ''), users.name),
    handle = coalesce(nullif(excluded.handle, ''), users.handle),
    avatar = excluded.avatar,
    updated_at = now()
  returning * into v_user;

  -- Update name and avatar in party memberships
  update party_members
  set name = coalesce(nullif(p_name, ''), name),
      avatar = p_avatar
  where user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'user', to_jsonb(v_user)
  );
end;
$$;
