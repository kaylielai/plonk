
-- ============================================================
-- ENUMS
-- ============================================================
create type public.app_role as enum ('admin', 'user');
create type public.idea_status as enum ('collecting', 'suggested', 'confirmed', 'completed', 'stale');
create type public.response_source as enum ('app', 'lite');

-- ============================================================
-- USER ROLES + has_role helper
-- ============================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  passport_cover_color text not null default 'navy',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
-- Anyone signed in can read profiles (needed to show names/avatars of group members and idea participants)
create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- GROUPS + MEMBERSHIP
-- ============================================================
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_color text not null default 'teal',
  invite_token text not null unique default encode(gen_random_bytes(9), 'base64'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.groups to authenticated;
grant all on public.groups to service_role;

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  pinned boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
grant select, insert, update, delete on public.group_members to authenticated;
grant all on public.group_members to service_role;

-- Security definer helper: is a user a member of a group? (avoids RLS recursion)
create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = _group_id and user_id = _user_id)
$$;

alter table public.groups enable row level security;
create policy "members read groups" on public.groups for select to authenticated
  using (public.is_group_member(id, auth.uid()) or created_by = auth.uid());
create policy "authenticated create groups" on public.groups for insert to authenticated with check (created_by = auth.uid());
create policy "creator updates groups" on public.groups for update to authenticated using (created_by = auth.uid());

alter table public.group_members enable row level security;
create policy "members read own group memberships" on public.group_members for select to authenticated
  using (user_id = auth.uid() or public.is_group_member(group_id, auth.uid()));
create policy "self join group" on public.group_members for insert to authenticated with check (user_id = auth.uid());
create policy "self update membership" on public.group_members for update to authenticated using (user_id = auth.uid());
create policy "self leave group" on public.group_members for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- IDEAS
-- ============================================================
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  timeframe_label text not null,
  tag text not null,
  group_id uuid references public.groups(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  status public.idea_status not null default 'collecting',
  suggested_day text,
  suggested_time text,
  confirmed_time timestamptz,
  confirmed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (group_id is not null or recipient_user_id is not null)
);
grant select, insert, update, delete on public.ideas to authenticated;
grant all on public.ideas to service_role;

-- Access helper — is user allowed to see this idea?
create or replace function public.can_access_idea(_idea_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.ideas i
    where i.id = _idea_id
      and (
        i.created_by = _user_id
        or i.recipient_user_id = _user_id
        or (i.group_id is not null and public.is_group_member(i.group_id, _user_id))
      )
  )
$$;

alter table public.ideas enable row level security;
create policy "read visible ideas" on public.ideas for select to authenticated
  using (
    created_by = auth.uid()
    or recipient_user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );
create policy "create ideas as self" on public.ideas for insert to authenticated with check (created_by = auth.uid());
-- Any participant (app user) can update status (e.g. confirm) — decision 2
create policy "participants update ideas" on public.ideas for update to authenticated
  using (
    created_by = auth.uid()
    or recipient_user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- ============================================================
-- IDEA PARTICIPANTS
-- ============================================================
create table public.idea_participants (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  lite_display_name text,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id),
  check (user_id is not null or lite_display_name is not null)
);
grant select, insert, update, delete on public.idea_participants to authenticated;
grant select, insert on public.idea_participants to anon; -- lite link submissions
grant all on public.idea_participants to service_role;
alter table public.idea_participants enable row level security;
create policy "read participants if can access idea" on public.idea_participants for select to authenticated
  using (public.can_access_idea(idea_id, auth.uid()));
create policy "add self as participant" on public.idea_participants for insert to authenticated
  with check (user_id = auth.uid() and public.can_access_idea(idea_id, auth.uid()));

-- ============================================================
-- AVAILABILITY RESPONSES
-- ============================================================
create table public.availability_responses (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  participant_id uuid not null references public.idea_participants(id) on delete cascade,
  slots jsonb not null default '{}'::jsonb,
  submitted_via public.response_source not null default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id)
);
grant select, insert, update on public.availability_responses to authenticated;
grant all on public.availability_responses to service_role;
alter table public.availability_responses enable row level security;
create policy "read responses if can access idea" on public.availability_responses for select to authenticated
  using (public.can_access_idea(idea_id, auth.uid()));
create policy "write own response" on public.availability_responses for insert to authenticated
  with check (public.can_access_idea(idea_id, auth.uid()));
create policy "update own response" on public.availability_responses for update to authenticated
  using (public.can_access_idea(idea_id, auth.uid()));

-- ============================================================
-- HANGOUTS
-- ============================================================
create table public.hangouts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null unique references public.ideas(id) on delete cascade,
  confirmed_time timestamptz not null,
  confirmed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.hangouts to authenticated;
grant all on public.hangouts to service_role;
alter table public.hangouts enable row level security;
create policy "read hangouts if can access idea" on public.hangouts for select to authenticated
  using (public.can_access_idea(idea_id, auth.uid()));
create policy "create hangouts if can access idea" on public.hangouts for insert to authenticated
  with check (public.can_access_idea(idea_id, auth.uid()) and confirmed_by = auth.uid());

-- ============================================================
-- STAMPS
-- ============================================================
create table public.stamps (
  id uuid primary key default gen_random_uuid(),
  hangout_id uuid not null references public.hangouts(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  photo_url text,
  art_url text,
  caption text,
  created_at timestamptz not null default now(),
  unique (hangout_id, owner_user_id)
);
grant select, insert, update, delete on public.stamps to authenticated;
grant all on public.stamps to service_role;
alter table public.stamps enable row level security;
-- One's own passport is private. Attendees of same hangout can see (for detail view showing "who else got stamped").
create policy "read own stamps" on public.stamps for select to authenticated using (owner_user_id = auth.uid());
create policy "read costamps if attendee" on public.stamps for select to authenticated
  using (exists (select 1 from public.stamps s2 where s2.hangout_id = stamps.hangout_id and s2.owner_user_id = auth.uid()));

-- ============================================================
-- LITE TOKENS (no-install idea sharing)
-- ============================================================
create table public.lite_tokens (
  token text primary key default encode(gen_random_bytes(12), 'base64'),
  idea_id uuid not null unique references public.ideas(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
grant select on public.lite_tokens to anon, authenticated;
grant insert, delete on public.lite_tokens to authenticated;
grant all on public.lite_tokens to service_role;
alter table public.lite_tokens enable row level security;
-- Anon can look up by token (they have the token in the URL — it acts as capability)
create policy "anyone read tokens" on public.lite_tokens for select to anon, authenticated using (expires_at > now());
create policy "creator mints tokens" on public.lite_tokens for insert to authenticated with check (public.can_access_idea(idea_id, auth.uid()));

-- Public view for the lite link (safe columns only) — expose via a security-definer RPC instead of broad grant
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
grant execute on function public.lite_idea_summary(text) to anon, authenticated;

-- RPC that lets an anon submit lite availability via a token (bypasses RLS safely)
create or replace function public.lite_submit_availability(_token text, _display_name text, _slots jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  _idea_id uuid;
  _participant_id uuid;
begin
  select idea_id into _idea_id from public.lite_tokens where token = _token and expires_at > now();
  if _idea_id is null then
    raise exception 'Invalid or expired token';
  end if;

  insert into public.idea_participants (idea_id, lite_display_name) values (_idea_id, _display_name)
  returning id into _participant_id;

  insert into public.availability_responses (idea_id, participant_id, slots, submitted_via)
  values (_idea_id, _participant_id, _slots, 'lite');

  return _participant_id;
end;
$$;
grant execute on function public.lite_submit_availability(text, text, jsonb) to anon;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications read" on public.notifications for update to authenticated using (user_id = auth.uid());

-- ============================================================
-- updated_at helpers
-- ============================================================
create or replace function public.tg_set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.tg_set_updated_at();
create trigger set_ideas_updated_at before update on public.ideas for each row execute function public.tg_set_updated_at();
create trigger set_availability_updated_at before update on public.availability_responses for each row execute function public.tg_set_updated_at();

-- ============================================================
-- STORAGE POLICIES (buckets are created via storage tools)
-- ============================================================
-- hangout-photos: anyone signed in can upload; anyone signed in can read
create policy "authenticated read hangout photos" on storage.objects for select to authenticated
  using (bucket_id = 'hangout-photos');
create policy "authenticated upload hangout photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'hangout-photos');

create policy "public read stamp art" on storage.objects for select to public
  using (bucket_id = 'stamp-art');
create policy "service writes stamp art" on storage.objects for insert to authenticated
  with check (bucket_id = 'stamp-art');

create policy "public read avatars" on storage.objects for select to public
  using (bucket_id = 'avatars');
create policy "users write own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');
create policy "users update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars');
