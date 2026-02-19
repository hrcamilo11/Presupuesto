-- Allow both creditors and debtors to add payments to a collection
DROP POLICY IF EXISTS "Creditors can add payments" ON public.collection_payments;

CREATE POLICY "Creditors and debtors can add payments"
    ON public.collection_payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = collection_payments.collection_id
            AND (auth.uid() = c.creditor_id OR auth.uid() = c.debtor_id)
        )
    );

-- Also ensure RLS for expenses and incomes allows linked collection payments
-- (Already covered by user_id = auth.uid() but good to keep in mind)
