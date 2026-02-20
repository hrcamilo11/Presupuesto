
-- Fix RLS for loan_payments to allow access via shared accounts and use optimized (select auth.uid())
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
