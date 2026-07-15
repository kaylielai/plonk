
-- ============================================================
-- Move internal SECURITY DEFINER helpers to a private schema
-- so they are not exposed via PostgREST (Data API).
-- ============================================================
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- Drop policies that depend on public helpers so we can recreate them.
drop policy if exists "members read groups" on public.groups;
drop policy if exists "members read own group memberships" on public.group_members;
drop policy if exists "read visible ideas" on public.ideas;
drop policy if exists "participants update ideas" on public.ideas;
drop policy if exists "read participants if can access idea" on public.idea_participants;
drop policy if exists "add self as participant" on public.idea_participants;
drop policy if exists "read responses if can access idea" on public.availability_responses;
drop policy if exists "write own response" on public.availability_responses;
drop policy if exists "update own response" on public.availability_responses;
drop policy if exists "read hangouts if can access idea" on public.hangouts;
drop policy if exists "create hangouts if can access idea" on public.hangouts;
drop policy if exists "creator mints tokens" on public.lite_tokens;

-- Recreate helpers inside private schema.
create or replace function private.is_group_member(_group_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = _group_id and user_id = _user_id)
$$;

create or replace function private.can_access_idea(_idea_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ideas i
    where i.id = _idea_id
      and (
        i.created_by = _user_id
        or i.recipient_user_id = _user_id
        or (i.group_id is not null and private.is_group_member(i.group_id, _user_id))
      )
  )
$$;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Only authenticated needs to execute these in RLS predicates.
revoke all on function private.is_group_member(uuid, uuid) from public;
revoke all on function private.can_access_idea(uuid, uuid) from public;
revoke all on function private.has_role(uuid, public.app_role) from public;
grant execute on function private.is_group_member(uuid, uuid) to authenticated, service_role;
grant execute on function private.can_access_idea(uuid, uuid) to authenticated, service_role;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

-- Drop public copies of the helpers now that nothing depends on them.
drop function if exists public.is_group_member(uuid, uuid);
drop function if exists public.can_access_idea(uuid, uuid);
drop function if exists public.has_role(uuid, public.app_role);

-- Lock down trigger helper functions from being callable via the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.tg_set_updated_at() from public, anon, authenticated;

-- Fix mutable search_path on tg_set_updated_at.
create or replace function public.tg_set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
revoke all on function public.tg_set_updated_at() from public, anon, authenticated;

-- ============================================================
-- Recreate policies using private helpers
-- ============================================================
create policy "members read groups" on public.groups for select to authenticated
  using (private.is_group_member(id, auth.uid()) or created_by = auth.uid());

create policy "members read own group memberships" on public.group_members for select to authenticated
  using (user_id = auth.uid() or private.is_group_member(group_id, auth.uid()));

create policy "read visible ideas" on public.ideas for select to authenticated
  using (
    created_by = auth.uid()
    or recipient_user_id = auth.uid()
    or (group_id is not null and private.is_group_member(group_id, auth.uid()))
  );

create policy "participants update ideas" on public.ideas for update to authenticated
  using (
    created_by = auth.uid()
    or recipient_user_id = auth.uid()
    or (group_id is not null and private.is_group_member(group_id, auth.uid()))
  );

create policy "read participants if can access idea" on public.idea_participants for select to authenticated
  using (private.can_access_idea(idea_id, auth.uid()));

create policy "add self as participant" on public.idea_participants for insert to authenticated
  with check (user_id = auth.uid() and private.can_access_idea(idea_id, auth.uid()));

create policy "read responses if can access idea" on public.availability_responses for select to authenticated
  using (private.can_access_idea(idea_id, auth.uid()));

create policy "write own response" on public.availability_responses for insert to authenticated
  with check (private.can_access_idea(idea_id, auth.uid()));

create policy "update own response" on public.availability_responses for update to authenticated
  using (private.can_access_idea(idea_id, auth.uid()));

create policy "read hangouts if can access idea" on public.hangouts for select to authenticated
  using (private.can_access_idea(idea_id, auth.uid()));

create policy "create hangouts if can access idea" on public.hangouts for insert to authenticated
  with check (private.can_access_idea(idea_id, auth.uid()) and confirmed_by = auth.uid());

create policy "creator mints tokens" on public.lite_tokens for insert to authenticated
  with check (private.can_access_idea(idea_id, auth.uid()));

-- Rewrite lite RPCs to use private helper and stay callable by anon.
create or replace function public.lite_idea_summary(_token text)
returns table (idea_id uuid, title text, timeframe_label text, tag text, group_name text, response_count int)
language sql stable security definer set search_path = public as $$
  select
    i.id,
    i.title,
    i.timeframe_label,
    i.tag,
    coalesce(g.name, 'a 1:1 hangout') as group_name,
    (select count(*)::int from public.availability_responses ar where ar.idea_id = i.id)
  from public.lite_tokens t
  join public.ideas i on i.id = t.idea_id
  left join public.groups g on g.id = i.group_id
  where t.token = _token and t.expires_at > now()
$$;

-- ============================================================
-- profiles: restrict SELECT to shared context only
-- ============================================================
drop policy if exists "authenticated read profiles" on public.profiles;

create or replace function private.shares_context_with(_viewer uuid, _target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    _viewer = _target
    or exists (
      select 1 from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = _viewer and gm2.user_id = _target
    )
    or exists (
      select 1 from public.idea_participants ip1
      join public.idea_participants ip2 on ip1.idea_id = ip2.idea_id
      where ip1.user_id = _viewer and ip2.user_id = _target
    )
    or exists (
      select 1 from public.ideas i
      where (i.created_by = _viewer and i.recipient_user_id = _target)
         or (i.created_by = _target and i.recipient_user_id = _viewer)
    );
$$;
revoke all on function private.shares_context_with(uuid, uuid) from public;
grant execute on function private.shares_context_with(uuid, uuid) to authenticated, service_role;

create policy "read shared profiles" on public.profiles for select to authenticated
  using (private.shares_context_with(auth.uid(), user_id));

-- ============================================================
-- lite_tokens: no broad SELECT — reads only through security-definer RPCs
-- ============================================================
drop policy if exists "anyone read tokens" on public.lite_tokens;
revoke select on public.lite_tokens from anon, authenticated;

-- ============================================================
-- STORAGE POLICIES — rebuild with ownership checks
-- ============================================================
drop policy if exists "authenticated read hangout photos" on storage.objects;
drop policy if exists "authenticated upload hangout photos" on storage.objects;
drop policy if exists "public read stamp art" on storage.objects;
drop policy if exists "service writes stamp art" on storage.objects;
drop policy if exists "public read avatars" on storage.objects;
drop policy if exists "users write own avatar" on storage.objects;
drop policy if exists "users update own avatar" on storage.objects;

-- hangout-photos: path is "<hangout_id>/<file>". Only users who can access the
-- hangout's idea can read or upload files for that hangout.
create policy "participants read hangout photos" on storage.objects for select to authenticated
  using (
    bucket_id = 'hangout-photos'
    and exists (
      select 1 from public.hangouts h
      where h.id::text = (storage.foldername(name))[1]
        and private.can_access_idea(h.idea_id, auth.uid())
    )
  );

create policy "participants upload hangout photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'hangout-photos'
    and exists (
      select 1 from public.hangouts h
      where h.id::text = (storage.foldername(name))[1]
        and private.can_access_idea(h.idea_id, auth.uid())
    )
  );

-- stamp-art: read only if you own a stamp that uses this image or share the hangout.
-- Writes are done by the server function via service role and require no user policy.
create policy "attendees read stamp art" on storage.objects for select to authenticated
  using (
    bucket_id = 'stamp-art'
    and exists (
      select 1 from public.stamps s
      where s.art_url = 'stamp-art/' || storage.objects.name
        and (
          s.owner_user_id = auth.uid()
          or exists (
            select 1 from public.stamps s2
            where s2.hangout_id = s.hangout_id and s2.owner_user_id = auth.uid()
          )
        )
    )
  );

-- avatars: signed-in users may read; users may only write files inside their own user_id folder.
create policy "authenticated read avatars" on storage.objects for select to authenticated
  using (bucket_id = 'avatars');

create policy "users upload own avatar" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users update own avatar" on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own avatar" on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
