-- =============================================================
-- PENDING MIGRATIONS - Apply via Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/vzohoiwmjcuqhndsoazx/sql/new
-- =============================================================

-- ----
-- Migration 1: Fix loan_payments RLS to allow shared account access
-- (file: 20260218000008_fix_loan_payments_rls.sql)
-- ----
DROP POLICY IF EXISTS "Users can manage own loan_payments via loan" ON public.loan_payments;

CREATE POLICY "Users can manage own loan_payments via loan"
  ON public.loan_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id 
        AND (l.user_id = (select auth.uid()) OR (l.shared_account_id IS NOT NULL AND l.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id 
        AND (l.user_id = (select auth.uid()) OR (l.shared_account_id IS NOT NULL AND l.shared_account_id IN (SELECT public.user_shared_account_ids((select auth.uid())))))
    )
  );

-- ----
-- Migration 2: Allow all authenticated users to view profiles (needed for friends/search)
-- (file: 20260220000000_fix_profiles_rls.sql)
-- ----
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
