-- ==============================================================================
-- PARTYLOT — PR-03: Atomic Server-Side Invite Validation & Join RPCs
-- ==============================================================================

-- 1. Validate Invite Code RPC
create or replace function public.validate_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_party record;
begin
  select * into v_invite
  from invitations
  where upper(code) = upper(trim(p_code))
    and is_revoked = false;

  if not found then
    return jsonb_build_object(
      'valid', false,
      'error', 'Invite code could not be verified or is revoked.'
    );
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return jsonb_build_object(
      'valid', false,
      'error', 'This invitation has expired.'
    );
  end if;

  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    return jsonb_build_object(
      'valid', false,
      'error', 'Invitation code has reached maximum uses.'
    );
  end if;

  select id, title, location, date into v_party
  from parties
  where id = v_invite.party_id;

  return jsonb_build_object(
    'valid', true,
    'party_id', v_invite.party_id,
    'party_title', coalesce(v_party.title, ''),
    'party_location', coalesce(v_party.location, '')
  );
end;
$$;

-- 2. Atomic Join Party With Invite RPC
create or replace function public.join_party_with_invite(
  p_user_id text,
  p_user_name text,
  p_user_handle text,
  p_user_avatar text,
  p_user_wallet text,
  p_invite_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
  v_party record;
  v_member record;
  v_party_json jsonb;
  v_members_json jsonb;
begin
  -- 1. Normalize code and find active invite with row lock
  select * into v_invite
  from invitations
  where upper(code) = upper(trim(p_invite_code))
    and is_revoked = false
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'INVITE_NOT_FOUND',
      'message', 'Invite code could not be verified or is revoked.'
    );
  end if;

  -- 2. Check expiration
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return jsonb_build_object(
      'success', false,
      'error', 'INVITE_EXPIRED',
      'message', 'This invitation has expired.'
    );
  end if;

  -- 3. Check usage limit
  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    return jsonb_build_object(
      'success', false,
      'error', 'INVITE_MAX_USES_REACHED',
      'message', 'Invitation code has reached maximum uses.'
    );
  end if;

  -- 4. Find the party
  select * into v_party
  from parties
  where id = v_invite.party_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'PARTY_NOT_FOUND',
      'message', 'The party associated with this invitation does not exist.'
    );
  end if;

  -- 5. Upsert the user profile in users table
  insert into users (
    id, name, handle, avatar, wallet_address, updated_at
  ) values (
    p_user_id,
    coalesce(nullif(p_user_name, ''), 'PartyMember'),
    coalesce(nullif(p_user_handle, ''), '@partymember'),
    p_user_avatar,
    p_user_wallet,
    now()
  )
  on conflict (id) do update set
    name = coalesce(nullif(excluded.name, ''), users.name),
    handle = coalesce(nullif(excluded.handle, ''), users.handle),
    avatar = coalesce(excluded.avatar, users.avatar),
    wallet_address = coalesce(excluded.wallet_address, users.wallet_address),
    updated_at = now();

  -- 6. Add user to party_members (idempotent)
  select * into v_member
  from party_members
  where party_id = v_party.id and user_id = p_user_id;

  if not found then
    insert into party_members (
      party_id,
      user_id,
      name,
      avatar,
      role,
      status,
      wallet_address,
      nights_together,
      joined_at
    ) values (
      v_party.id,
      p_user_id,
      coalesce(nullif(p_user_name, ''), 'PartyMember'),
      p_user_avatar,
      'guest',
      'going',
      p_user_wallet,
      1,
      now()
    )
    returning * into v_member;

    -- Increment invite used_count
    update invitations
    set used_count = used_count + 1
    where id = v_invite.id;

    -- Log join activity
    insert into activities (
      id,
      party_id,
      type,
      text,
      time,
      avatar,
      created_at
    ) values (
      'act-' || gen_random_uuid(),
      v_party.id,
      'join',
      coalesce(nullif(p_user_name, ''), 'A new member') || ' joined the party!',
      'Just now',
      p_user_avatar,
      now()
    );
  end if;

  -- 7. Build full party object and members for immediate client hydration
  select jsonb_agg(to_jsonb(m)) into v_members_json
  from party_members m
  where m.party_id = v_party.id;

  v_party_json := to_jsonb(v_party) || jsonb_build_object('members', coalesce(v_members_json, '[]'::jsonb));

  return jsonb_build_object(
    'success', true,
    'party_id', v_party.id,
    'party', v_party_json,
    'membership', to_jsonb(v_member)
  );
end;
$$;
