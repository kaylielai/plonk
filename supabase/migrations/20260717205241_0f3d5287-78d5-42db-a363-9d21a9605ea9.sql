
-- Usernames + schedule fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS schedule_view text NOT NULL DEFAULT 'week',
  ADD COLUMN IF NOT EXISTS weekly_schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS monthly_schedule jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Case-insensitive unique username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Validate format via trigger (letters, numbers, underscores, 3-20 chars)
CREATE OR REPLACE FUNCTION public.tg_validate_username()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    IF NEW.username !~ '^[A-Za-z0-9_]{3,20}$' THEN
      RAISE EXCEPTION 'Invalid username. Use 3-20 letters, numbers, or underscores.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_username ON public.profiles;
CREATE TRIGGER validate_username
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_validate_username();

-- RPC: add someone to a group by username. Caller must be a member.
CREATE OR REPLACE FUNCTION public.add_group_member_by_username(_group_id uuid, _username text)
RETURNS TABLE(user_id uuid, display_name text, username text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_id uuid;
  _target_name text;
  _target_username text;
BEGIN
  IF NOT private.is_group_member(_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  SELECT p.user_id, p.display_name, p.username
    INTO _target_id, _target_name, _target_username
  FROM public.profiles p
  WHERE lower(p.username) = lower(_username);

  IF _target_id IS NULL THEN
    RAISE EXCEPTION 'No user found with that username';
  END IF;

  INSERT INTO public.group_members (group_id, user_id)
  VALUES (_group_id, _target_id)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN QUERY SELECT _target_id, _target_name, _target_username;
END;
$$;

REVOKE ALL ON FUNCTION public.add_group_member_by_username(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_group_member_by_username(uuid, text) TO authenticated;
