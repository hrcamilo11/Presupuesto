-- Add external_id for transaction deduplication from Nequi
ALTER TABLE public.incomes
ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS external_id TEXT;
-- Add unique constraints to prevent duplicates
ALTER TABLE public.incomes
ADD CONSTRAINT incomes_wallet_id_external_id_key UNIQUE (wallet_id, external_id);
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_wallet_id_external_id_key UNIQUE (wallet_id, external_id);
-- Add Nequi specific config and sync tracking to wallets
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS nequi_config JSONB DEFAULT NULL;
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT NULL;
COMMENT ON COLUMN public.wallets.nequi_config IS 'Stores client_id, client_secret (preferably encrypted), and phone_number for Conecta Nequi.';
COMMENT ON COLUMN public.incomes.external_id IS 'Unique transaction ID from Nequi for deduplication.';
COMMENT ON COLUMN public.expenses.external_id IS 'Unique transaction ID from Nequi for deduplication.';