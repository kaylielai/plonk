CREATE TABLE public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connector_id)
);

GRANT SELECT ON public.app_user_connections TO authenticated;
GRANT ALL ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user can see own connection existence"
ON public.app_user_connections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER app_user_connections_set_updated_at
BEFORE UPDATE ON public.app_user_connections
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();