-- Create expense_comments table
CREATE TABLE IF NOT EXISTS public.expense_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.expense_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Members of the shared account the expense belongs to can view and add comments
CREATE POLICY "Members can view comments on shared expenses"
ON public.expense_comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.expenses e
        JOIN public.shared_account_members sam ON e.shared_account_id = sam.shared_account_id
        WHERE e.id = expense_comments.expense_id
        AND sam.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.expenses e
        WHERE e.id = expense_comments.expense_id
        AND e.user_id = auth.uid()
    )
);

CREATE POLICY "Members can insert comments on shared expenses"
ON public.expense_comments
FOR INSERT
WITH CHECK (
    auth.uid() = user_id
    AND (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.shared_account_members sam ON e.shared_account_id = sam.shared_account_id
            WHERE e.id = expense_id
            AND sam.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = expense_id
            AND e.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage their own comments"
ON public.expense_comments
FOR ALL
USING (auth.uid() = user_id);
