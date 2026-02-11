-- Re-enable RLS on savings tables so each user only sees their own personal data
-- and shared data from accounts they belong to. No user can see another user's
-- personal savings, transactions, or plans.

-- 1. Savings Goals: personal (user_id = auth.uid(), shared_account_id IS NULL) or shared account member
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view savings goals (own or shared)" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert savings goals (own or shared)" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update savings goals (own or shared)" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete savings goals (own or shared)" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Authenticated can insert savings goals" ON public.savings_goals;

CREATE POLICY "Users can view own or shared savings goals"
  ON public.savings_goals FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert own or shared savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (shared_account_id IS NULL OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can update own or shared savings goals"
  ON public.savings_goals FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete own or shared savings goals"
  ON public.savings_goals FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- 2. Savings Transactions: only via a goal the user can access
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage savings transactions via goal" ON public.savings_transactions;

CREATE POLICY "Users can view savings transactions via goal"
  ON public.savings_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
      AND (
        g.user_id = auth.uid()
        OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  );

CREATE POLICY "Users can insert savings transactions via goal"
  ON public.savings_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
      AND (
        g.user_id = auth.uid()
        OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  );

CREATE POLICY "Users can update savings transactions via goal"
  ON public.savings_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
      AND (
        g.user_id = auth.uid()
        OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  );

CREATE POLICY "Users can delete savings transactions via goal"
  ON public.savings_transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
      AND (
        g.user_id = auth.uid()
        OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  );

-- 3. Savings Plans: each user only their own plans (user_id = auth.uid())
ALTER TABLE public.savings_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own savings plans" ON public.savings_plans;

CREATE POLICY "Users can manage own savings plans"
  ON public.savings_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Shared savings goals: re-enable if it was disabled (members only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shared_savings_goals') THEN
    EXECUTE 'ALTER TABLE public.shared_savings_goals ENABLE ROW LEVEL SECURITY';
    -- Policies may already exist from 20250222000000_shared_features.sql; drop and recreate to be sure
    EXECUTE 'DROP POLICY IF EXISTS "Members can view shared savings goals" ON public.shared_savings_goals';
    EXECUTE 'DROP POLICY IF EXISTS "Members can manage shared savings goals" ON public.shared_savings_goals';
    EXECUTE 'CREATE POLICY "Members can view shared savings goals" ON public.shared_savings_goals FOR SELECT USING (shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))';
    EXECUTE 'CREATE POLICY "Members can manage shared savings goals" ON public.shared_savings_goals FOR ALL USING (shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))) WITH CHECK (shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))';
  END IF;
END $$;

COMMENT ON POLICY "Users can view own or shared savings goals" ON public.savings_goals IS 'Personal: user_id = auth.uid(). Shared: member of shared_account_id.';
COMMENT ON POLICY "Users can manage own savings plans" ON public.savings_plans IS 'Each user only sees and manages their own savings plans.';
