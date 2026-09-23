-- ==============================================================================
-- PARTYLOT MIGRATION: 20260923_pr05_unique_user_handles.sql
-- Description: Enforce unique user handles (@handle) case-insensitively,
--              prevent duplicate usernames, and update profile/invite RPCs.
-- ==============================================================================

-- 1. Create a case-insensitive unique index on users.handle
create unique index if not exists users_unique_lower_handle_idx
  on public.users (lower(handle));

-- 2. Enhanced update_user_profile RPC with uniqueness check and validation
create or replace function public.update_user_profile(
  p_user_id text,
  p_name text,
  p_handle text,
  p_avatar text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cleaned_name text;
  v_cleaned_handle text;
  v_handle_core text;
  v_existing_user_with_handle text;
  v_updated_user record;
begin
  -- Validate inputs
  v_cleaned_name := trim(coalesce(p_name, ''));
  if v_cleaned_name = '' then
    return jsonb_build_object(
      'success', false,
      'error', 'INVALID_NAME',
      'message', 'El nombre de usuario es obligatorio.'
    );
  end if;

  v_cleaned_handle := trim(coalesce(p_handle, ''));
  if v_cleaned_handle = '' then
    -- Generate unique fallback if none provided
    v_cleaned_handle := '@user_' || substr(md5(p_user_id), 1, 6);
  end if;

  -- Ensure handle starts with '@'
  if not v_cleaned_handle like '@%' then
    v_cleaned_handle := '@' || v_cleaned_handle;
  end if;

  -- Validate handle format (after @, letters, numbers, underscores, 3-24 chars)
  v_handle_core := substring(v_cleaned_handle from 2);
  if not (v_handle_core ~* '^[a-zA-Z0-9_]{3,24}$') then
    return jsonb_build_object(
      'success', false,
      'error', 'INVALID_HANDLE_FORMAT',
      'message', 'El @handle debe contener entre 3 y 24 caracteres alfanuméricos o guión bajo.'
    );
  end if;

  -- 3. Check for handle uniqueness across all other users (case-insensitive)
  select id into v_existing_user_with_handle
  from public.users
  where lower(handle) = lower(v_cleaned_handle)
    and id != p_user_id
  limit 1;

  if v_existing_user_with_handle is not null then
    return jsonb_build_object(
      'success', false,
      'error', 'HANDLE_ALREADY_EXISTS',
      'message', 'El usuario ' || v_cleaned_handle || ' ya existe. Por favor elige otro @.'
    );
  end if;

  -- 4. Upsert user record
  insert into public.users (
    id, name, handle, avatar, updated_at
  )
  values (
    p_user_id,
    v_cleaned_name,
    v_cleaned_handle,
    nullif(trim(coalesce(p_avatar, '')), ''),
    timezone('utc'::text, now())
  )
  on conflict (id) do update set
    name = excluded.name,
    handle = excluded.handle,
    avatar = excluded.avatar,
    updated_at = timezone('utc'::text, now())
  returning id, name, handle, avatar, wallet_address into v_updated_user;

  -- 5. Cascade updated name and avatar to party_members table
  update public.party_members
  set
    name = v_cleaned_name,
    avatar = nullif(trim(coalesce(p_avatar, '')), '')
  where user_id = p_user_id;

  return jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_updated_user.id,
      'name', v_updated_user.name,
      'handle', v_updated_user.handle,
      'avatar', v_updated_user.avatar,
      'walletAddress', v_updated_user.wallet_address
    )
  );
end;
$$;

-- Grant execution to service role and anon/authenticated
grant execute on function public.update_user_profile(text, text, text, text) to authenticated, service_role;

-- 3. Read profile RPC with security definer
create or replace function public.get_user_profile(p_user_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
begin
  select id, name, handle, avatar, wallet_address
  into v_user
  from public.users
  where id = p_user_id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'handle', v_user.handle,
    'avatar', v_user.avatar,
    'walletAddress', v_user.wallet_address
  );
end;
$$;

grant execute on function public.get_user_profile(text) to authenticated, anon, service_role;

