-- Add creditor_name and adjust creditor_id to be nullable for debtor-initiated debts
ALTER TABLE public.collections ALTER COLUMN creditor_id DROP NOT NULL;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS creditor_name TEXT;

-- Add 'partially_paid' status to collection_status enum
-- Note: In Postgres, adding values to an enum is usually done like this:
ALTER TYPE public.collection_status ADD VALUE IF NOT EXISTS 'partially_paid' AFTER 'active';

-- Create Collection Payments Table
CREATE TABLE IF NOT EXISTS public.collection_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for payments
ALTER TABLE public.collection_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their collections/debts"
    ON public.collection_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = collection_payments.collection_id
            AND (auth.uid() = c.creditor_id OR auth.uid() = c.debtor_id)
        )
    );

CREATE POLICY "Creditors can add payments"
    ON public.collection_payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c
            WHERE c.id = collection_payments.collection_id
            AND auth.uid() = c.creditor_id
        )
    );
