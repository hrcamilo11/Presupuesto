-- 1. Shared Savings Goals
CREATE TABLE IF NOT EXISTS public.shared_savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_account_id UUID NOT NULL REFERENCES public.shared_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Shared Savings
ALTER TABLE public.shared_savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view shared savings goals"
    ON public.shared_savings_goals FOR SELECT
    USING (shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())));

CREATE POLICY "Members can manage shared savings goals"
    ON public.shared_savings_goals FOR ALL
    USING (shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
    WITH CHECK (shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())));

-- 2. Update Budgets to support Shared Accounts
-- This adds the column and updates the unique constraint
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

-- Update unique constraint (drop old one if exists)
-- Finding the constraint name might vary, but assuming default naming from previous migrations or standard postgres
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_id_period_key;
ALTER TABLE public.budgets ADD CONSTRAINT budgets_scope_key UNIQUE (user_id, category_id, period, shared_account_id);

-- Update RLS for Budgets to allow shared access
DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;

CREATE POLICY "Users can manage budgets (own or shared)"
    ON public.budgets FOR ALL
    USING (
        auth.uid() = user_id 
        OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
    );

-- Trigger for shared_savings_goals updated_at
CREATE TRIGGER update_shared_savings_goals_updated_at
    BEFORE UPDATE ON public.shared_savings_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
