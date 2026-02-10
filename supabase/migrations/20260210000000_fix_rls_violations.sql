-- 1. Fix Incomes RLS
DROP POLICY IF EXISTS "Users can manage own incomes" ON public.incomes;
CREATE POLICY "Users can manage own incomes"
  ON public.incomes FOR ALL
  USING (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- 2. Fix Expenses RLS
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
CREATE POLICY "Users can manage own expenses"
  ON public.expenses FOR ALL
  USING (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- 3. Fix Loans RLS
-- Add shared_account_id to loans if not exists (checked in previous audit it was added in actions but maybe not in DB for some users?)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Users can manage own loans" ON public.loans;
CREATE POLICY "Users can manage own loans"
  ON public.loans FOR ALL
  USING (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- 4. Fix Subscriptions RLS
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- 5. Fix Tax Obligations RLS
ALTER TABLE public.tax_obligations ADD COLUMN IF NOT EXISTS shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Users can manage own tax_obligations" ON public.tax_obligations;
CREATE POLICY "Users can manage own tax_obligations"
  ON public.tax_obligations FOR ALL
  USING (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- 6. Fix Savings Goals RLS (Crucial for personal goals)
DROP POLICY IF EXISTS "Users can insert savings goals (own or shared)" ON public.savings_goals;
CREATE POLICY "Users can insert savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id -- Allow creating own goals even if shared_account_id is null
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );
