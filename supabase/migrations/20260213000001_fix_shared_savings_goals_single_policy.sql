-- shared_savings_goals: FOR ALL already covers SELECT; drop the SELECT-only policy to remove multiple_permissive_policies.
DROP POLICY IF EXISTS "Members can view shared savings goals" ON public.shared_savings_goals;
-- "Members can manage shared savings goals" (FOR ALL) remains and covers SELECT, INSERT, UPDATE, DELETE.
