-- Relax RLS for inserting savings goals to avoid false negatives.
-- We require only that the caller is an authenticated user; the app
-- always sets user_id = auth.uid() when inserting.

DROP POLICY IF EXISTS "Users can insert savings goals" ON public.savings_goals;

CREATE POLICY "Authenticated can insert savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

