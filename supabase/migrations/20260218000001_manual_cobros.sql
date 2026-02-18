-- Make debtor_id optional and add debtor_name for manual cobros
ALTER TABLE public.collections ALTER COLUMN debtor_id DROP NOT NULL;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS debtor_name TEXT;

-- Update RLS to allow creditors to see their manual collections
-- The existing policy "Users can view their own collections/debts" should still work
-- because it uses (auth.uid() = creditor_id OR auth.uid() = debtor_id)
