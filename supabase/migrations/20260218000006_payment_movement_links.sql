-- Add movement links to collection_payments
ALTER TABLE public.collection_payments ADD COLUMN IF NOT EXISTS creditor_income_id UUID REFERENCES public.incomes(id) ON DELETE SET NULL;
ALTER TABLE public.collection_payments ADD COLUMN IF NOT EXISTS debtor_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Ensure RLS allows the involved users to update these links
DROP POLICY IF EXISTS "Creditors and debtors can add payments" ON public.collection_payments;
CREATE POLICY "Creditors and debtors can manage payments"
    ON public.collection_payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = collection_payments.collection_id
            AND (auth.uid() = c.creditor_id OR auth.uid() = c.debtor_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = collection_payments.collection_id
            AND (auth.uid() = c.creditor_id OR auth.uid() = c.debtor_id)
        )
    );
