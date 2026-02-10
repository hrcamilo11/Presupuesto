-- Add bank and debit card brand fields to wallets
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS bank TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS debit_card_brand TEXT DEFAULT NULL;
