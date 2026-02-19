-- Make creditor_id optional for manual debts (where the creditor doesn't have an account)
ALTER TABLE public.collections ALTER COLUMN creditor_id DROP NOT NULL;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS creditor_name TEXT;

-- Update RLS to allow both creditors and debtors to create collections/debts.
-- Previously only creditors could create records.
DROP POLICY IF EXISTS "Creditors can create collections" ON public.collections;

CREATE POLICY "Creditors and debtors can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = creditor_id OR auth.uid() = debtor_id);
