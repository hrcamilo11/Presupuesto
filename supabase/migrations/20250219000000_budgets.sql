-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    period VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'weekly', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, category_id, period)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own budgets"
ON public.budgets
FOR ALL
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
