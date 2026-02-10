-- 1. Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 2. Expense Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.expense_tags (
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (expense_id, tag_id)
);

-- 3. Income Tags (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.income_tags (
    income_id UUID NOT NULL REFERENCES public.incomes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (income_id, tag_id)
);

-- RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_tags ENABLE ROW LEVEL SECURITY;

-- Tags Policies
CREATE POLICY "Users can manage own tags"
    ON public.tags FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Expense Tags Policies
-- Can view if can view expense (own or shared)
CREATE POLICY "Users can view expense tags"
    ON public.expense_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_tags.expense_id
            AND (e.user_id = auth.uid() OR e.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
        )
    );

CREATE POLICY "Users can manage expense tags"
    ON public.expense_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_tags.expense_id
            AND (e.user_id = auth.uid() OR e.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_tags.expense_id
            AND (e.user_id = auth.uid() OR e.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
        )
    );

-- Income Tags Policies
CREATE POLICY "Users can view income tags"
    ON public.income_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.incomes i
            WHERE i.id = income_tags.income_id
            AND (i.user_id = auth.uid() OR i.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
        )
    );

CREATE POLICY "Users can manage income tags"
    ON public.income_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.incomes i
            WHERE i.id = income_tags.income_id
            AND (i.user_id = auth.uid() OR i.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.incomes i
            WHERE i.id = income_tags.income_id
            AND (i.user_id = auth.uid() OR i.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
        )
    );
