-- Fix Supabase linter advisories:
-- 1. auth_rls_initplan: use (select auth.uid()) and (select auth.role()) so they are not re-evaluated per row.
-- 2. multiple_permissive_policies: consolidate multiple permissive policies per (table, action) into one policy.

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can view each other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (
    (select auth.uid()) = id
    OR id IN (
      SELECT shared_account_members.user_id
      FROM shared_account_members
      WHERE shared_account_members.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- ========== NOTIFICATIONS ==========
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications (mark read)" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users cannot delete notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications (mark read)"
  ON public.notifications FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users cannot delete notifications"
  ON public.notifications FOR DELETE
  USING (false);

-- ========== NOTIFICATION_PREFERENCES ==========
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- ========== PUSH_SUBSCRIPTIONS ==========
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ========== CATEGORIES ==========
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;

CREATE POLICY "Users can manage own categories"
  ON public.categories FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== TAGS ==========
DROP POLICY IF EXISTS "Users can manage own tags" ON public.tags;

CREATE POLICY "Users can manage own tags"
  ON public.tags FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ========== EXPENSE_TAGS ==========
DROP POLICY IF EXISTS "Users can manage own expense_tags" ON public.expense_tags;

CREATE POLICY "Users can manage own expense_tags"
  ON public.expense_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_tags.expense_id
        AND (e.user_id = (select auth.uid()) OR (e.shared_account_id IS NOT NULL AND e.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  );

-- ========== INCOME_TAGS ==========
DROP POLICY IF EXISTS "Users can manage own income_tags" ON public.income_tags;

CREATE POLICY "Users can manage own income_tags"
  ON public.income_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.incomes
      WHERE incomes.id = income_tags.income_id AND incomes.user_id = (select auth.uid())
    )
  );

-- ========== BUDGETS ==========
DROP POLICY IF EXISTS "Users can manage budgets (own or shared)" ON public.budgets;

CREATE POLICY "Users can manage budgets (own or shared)"
  ON public.budgets FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== EXPENSE_COMMENTS (consolidate SELECT and INSERT) ==========
DROP POLICY IF EXISTS "Members can view comments on shared expenses" ON public.expense_comments;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.expense_comments;
DROP POLICY IF EXISTS "Members can insert comments on shared expenses" ON public.expense_comments;

CREATE POLICY "Users can view comments (own or shared expense)"
  ON public.expense_comments FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.shared_account_members sam ON e.shared_account_id = sam.shared_account_id
      WHERE e.id = expense_comments.expense_id AND sam.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_comments.expense_id AND e.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert comments (own or shared expense)"
  ON public.expense_comments FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      EXISTS (
        SELECT 1 FROM public.expenses e
        JOIN public.shared_account_members sam ON e.shared_account_id = sam.shared_account_id
        WHERE e.id = expense_id AND sam.user_id = (select auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_id AND e.user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.expense_comments FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.expense_comments FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ========== INCOMES ==========
DROP POLICY IF EXISTS "Users can manage own incomes" ON public.incomes;

CREATE POLICY "Users can manage own incomes"
  ON public.incomes FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== EXPENSES ==========
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;

CREATE POLICY "Users can manage own expenses"
  ON public.expenses FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== WALLETS ==========
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;

CREATE POLICY "Users can manage own wallets"
  ON public.wallets FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ========== LOANS ==========
DROP POLICY IF EXISTS "Users can manage own loans" ON public.loans;

CREATE POLICY "Users can manage own loans"
  ON public.loans FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== SUBSCRIPTIONS ==========
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== TAX_OBLIGATIONS ==========
DROP POLICY IF EXISTS "Users can manage own tax_obligations" ON public.tax_obligations;

CREATE POLICY "Users can manage own tax_obligations"
  ON public.tax_obligations FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== WALLET_TRANSFERS ==========
DROP POLICY IF EXISTS "Users can manage own transfers" ON public.wallet_transfers;

CREATE POLICY "Users can manage own transfers"
  ON public.wallet_transfers FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ========== SAVINGS_GOALS (consolidate 2 INSERT policies) ==========
DROP POLICY IF EXISTS "Users can view own or shared savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can insert own or shared savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "insert_savings_goals_authenticated" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can update own or shared savings goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Users can delete own or shared savings goals" ON public.savings_goals;

CREATE POLICY "Users can view own or shared savings goals"
  ON public.savings_goals FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

CREATE POLICY "Users can insert own or shared savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (
    (user_id = (select auth.uid()) AND (shared_account_id IS NULL OR shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    OR (select auth.role()) = 'authenticated'
  );

CREATE POLICY "Users can update own or shared savings goals"
  ON public.savings_goals FOR UPDATE
  USING (
    user_id = (select auth.uid())
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

CREATE POLICY "Users can delete own or shared savings goals"
  ON public.savings_goals FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid()))))
  );

-- ========== SAVINGS_TRANSACTIONS ==========
DROP POLICY IF EXISTS "Users can view savings transactions via goal" ON public.savings_transactions;
DROP POLICY IF EXISTS "Users can insert savings transactions via goal" ON public.savings_transactions;
DROP POLICY IF EXISTS "Users can update savings transactions via goal" ON public.savings_transactions;
DROP POLICY IF EXISTS "Users can delete savings transactions via goal" ON public.savings_transactions;

CREATE POLICY "Users can view savings transactions via goal"
  ON public.savings_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
        AND (g.user_id = (select auth.uid()) OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  );

CREATE POLICY "Users can insert savings transactions via goal"
  ON public.savings_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
        AND (g.user_id = (select auth.uid()) OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  );

CREATE POLICY "Users can update savings transactions via goal"
  ON public.savings_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
        AND (g.user_id = (select auth.uid()) OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  );

CREATE POLICY "Users can delete savings transactions via goal"
  ON public.savings_transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
        AND (g.user_id = (select auth.uid()) OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  );

-- ========== SAVINGS_PLANS ==========
DROP POLICY IF EXISTS "Users can manage own savings plans" ON public.savings_plans;

CREATE POLICY "Users can manage own savings plans"
  ON public.savings_plans FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ========== SHARED_ACCOUNTS (consolidate per action) ==========
DROP POLICY IF EXISTS "Members can view shared account" ON public.shared_accounts;
DROP POLICY IF EXISTS "User can create shared account" ON public.shared_accounts;
DROP POLICY IF EXISTS "Users can create shared accounts" ON public.shared_accounts;
DROP POLICY IF EXISTS "Owner can update shared account" ON public.shared_accounts;
DROP POLICY IF EXISTS "Owner can delete shared account" ON public.shared_accounts;
DROP POLICY IF EXISTS "Owners can manage shared account" ON public.shared_accounts;

CREATE POLICY "Users can view shared account"
  ON public.shared_accounts FOR SELECT
  USING (
    created_by = (select auth.uid())
    OR id IN (SELECT public.user_shared_account_ids((select auth.uid())))
    OR public.is_shared_account_owner(id, (select auth.uid()))
  );

CREATE POLICY "User can create shared account"
  ON public.shared_accounts FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Owner can update shared account"
  ON public.shared_accounts FOR UPDATE
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_accounts.id AND m.user_id = (select auth.uid()) AND m.role = 'owner'
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_accounts.id AND m.user_id = (select auth.uid()) AND m.role = 'owner'
    )
  );

CREATE POLICY "Owner can delete shared account"
  ON public.shared_accounts FOR DELETE
  USING (
    created_by = (select auth.uid())
    OR public.is_shared_account_owner(id, (select auth.uid()))
  );

-- ========== SHARED_ACCOUNT_MEMBERS (consolidate SELECT and DELETE) ==========
DROP POLICY IF EXISTS "Members can view members of same account" ON public.shared_account_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.shared_account_members;
DROP POLICY IF EXISTS "Anyone can leave" ON public.shared_account_members;

CREATE POLICY "Members can view members of same account"
  ON public.shared_account_members FOR SELECT
  USING (
    user_id = (select auth.uid())
    OR shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))
    OR public.is_shared_account_owner(shared_account_id, (select auth.uid()))
  );

CREATE POLICY "Owners can manage members"
  ON public.shared_account_members FOR INSERT
  WITH CHECK (public.is_shared_account_owner(shared_account_id, (select auth.uid())));

CREATE POLICY "Owners can update members"
  ON public.shared_account_members FOR UPDATE
  USING (public.is_shared_account_owner(shared_account_id, (select auth.uid())))
  WITH CHECK (public.is_shared_account_owner(shared_account_id, (select auth.uid())));

CREATE POLICY "Anyone can leave or owner can delete"
  ON public.shared_account_members FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR public.is_shared_account_owner(shared_account_id, (select auth.uid()))
  );

-- ========== SHARED_ACCOUNT_INVITES ==========
DROP POLICY IF EXISTS "Members can view invites of their account" ON public.shared_account_invites;
DROP POLICY IF EXISTS "Owner/member can create invite" ON public.shared_account_invites;
DROP POLICY IF EXISTS "Creator can delete invite" ON public.shared_account_invites;

CREATE POLICY "Members can view invites of their account"
  ON public.shared_account_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_invites.shared_account_id AND m.user_id = (select auth.uid())
    )
    OR invited_by = (select auth.uid())
  );

CREATE POLICY "Owner/member can create invite"
  ON public.shared_account_invites FOR INSERT
  WITH CHECK (
    invited_by = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_invites.shared_account_id AND m.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Creator can delete invite"
  ON public.shared_account_invites FOR DELETE
  USING (invited_by = (select auth.uid()));

-- ========== SHARED_SAVINGS_GOALS (consolidate 4 into 2) ==========
DROP POLICY IF EXISTS "Members can view shared savings goals" ON public.shared_savings_goals;
DROP POLICY IF EXISTS "Members can view shared goals" ON public.shared_savings_goals;
DROP POLICY IF EXISTS "Owners can manage shared goals" ON public.shared_savings_goals;
DROP POLICY IF EXISTS "Members can manage shared savings goals" ON public.shared_savings_goals;

CREATE POLICY "Members can view shared savings goals"
  ON public.shared_savings_goals FOR SELECT
  USING (
    shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))
    OR public.is_shared_account_owner(shared_account_id, (select auth.uid()))
  );

CREATE POLICY "Members can manage shared savings goals"
  ON public.shared_savings_goals FOR ALL
  USING (
    shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))
    OR public.is_shared_account_owner(shared_account_id, (select auth.uid()))
  )
  WITH CHECK (
    shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))
    OR public.is_shared_account_owner(shared_account_id, (select auth.uid()))
  );
