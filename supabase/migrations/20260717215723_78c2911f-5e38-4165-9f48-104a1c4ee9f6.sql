DROP POLICY IF EXISTS "creator updates groups" ON public.groups;
CREATE POLICY "members update groups" ON public.groups FOR UPDATE
  USING (private.is_group_member(id, auth.uid()) OR created_by = auth.uid())
  WITH CHECK (private.is_group_member(id, auth.uid()) OR created_by = auth.uid());