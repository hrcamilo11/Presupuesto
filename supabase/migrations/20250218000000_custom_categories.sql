-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'Tag',
    color TEXT DEFAULT '#3b82f6',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add category_id to incomes and expenses
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
    ON public.categories FOR ALL
    USING (
        auth.uid() = user_id OR 
        (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT user_shared_account_ids()))
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT user_shared_account_ids()))
    );

-- 4. Default categories trigger (optional but nice for new users)
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Expense Categories
    INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Comida', 'Utensils', '#ef4444', 'expense'),
    (NEW.id, 'Transporte', 'Car', '#3b82f6', 'expense'),
    (NEW.id, 'Vivienda', 'Home', '#10b981', 'expense'),
    (NEW.id, 'Entretenimiento', 'Gamepad2', '#8b5cf6', 'expense'),
    (NEW.id, 'Salud', 'HeartPulse', '#f43f5e', 'expense'),
    (NEW.id, 'Otros', 'DashedIcon', '#64748b', 'expense');

    -- Income Categories
    INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Salario', 'Banknote', '#22c55e', 'income'),
    (NEW.id, 'Ventas', 'ShoppingBag', '#eab308', 'income'),
    (NEW.id, 'Regalos', 'Gift', '#ec4899', 'income'),
    (NEW.id, 'Inversiones', 'TrendingUp', '#06b6d4', 'income');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We might already have handle_new_user trigger. We can add this to it or create a new one.
-- For simplicity, let's just make it a manual action or add to handle_new_user.
-- Let's check handle_new_user in initial_schema.sql.
