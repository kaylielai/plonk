GRANT SELECT, INSERT ON public.lite_tokens TO authenticated;
GRANT ALL ON public.lite_tokens TO service_role;

CREATE POLICY "creator reads tokens"
ON public.lite_tokens
FOR SELECT
TO authenticated
USING (private.can_access_idea(idea_id, auth.uid()));