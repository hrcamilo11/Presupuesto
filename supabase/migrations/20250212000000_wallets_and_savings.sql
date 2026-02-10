-- 1. Wallets (Cuentas)
CREATE TYPE wallet_type AS ENUM ('cash', 'debit', 'credit', 'savings', 'investment');

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type wallet_type NOT NULL DEFAULT 'cash',
  currency TEXT NOT NULL DEFAULT 'MXN',
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallets"
  ON public.wallets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Update Incomes/Expenses to link to Wallets
ALTER TABLE public.incomes
  ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  ADD COLUMN wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;

-- 3. Savings Goals
CREATE TYPE savings_goal_type AS ENUM ('manual', 'recurring');

CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
  target_date DATE,
  type savings_goal_type NOT NULL DEFAULT 'manual',
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Savings Goals
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view savings goals (own or shared)"
  ON public.savings_goals FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert savings goals (own or shared)"
  ON public.savings_goals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      shared_account_id IS NULL
      OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update savings goals (own or shared)"
  ON public.savings_goals FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete savings goals (own or shared)"
  ON public.savings_goals FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );


-- 4. Savings Transactions (Contributions)
CREATE TABLE public.savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL, -- Source of funds
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Savings Transactions
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage savings transactions via goal"
  ON public.savings_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = savings_transactions.savings_goal_id
      AND (
        g.user_id = auth.uid()
        OR (g.shared_account_id IS NOT NULL AND g.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  )
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

-- 5. Trigger to Enforce Shared Account Member Limit (Max 5)
CREATE OR REPLACE FUNCTION public.check_shared_account_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.shared_account_members WHERE shared_account_id = NEW.shared_account_id) >= 5 THEN
    RAISE EXCEPTION 'This shared account has reached the maximum limit of 5 members.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_member_limit_before_insert
  BEFORE INSERT ON public.shared_account_members
  FOR EACH ROW EXECUTE FUNCTION public.check_shared_account_member_limit();

-- 6. Helper: Create default 'Efectivo' wallet for existing users
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    INSERT INTO public.wallets (user_id, name, type, balance)
    VALUES (u.id, 'Efectivo', 'cash', 0.00)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
