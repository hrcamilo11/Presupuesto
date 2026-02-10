-- Add color column to wallets for personalization
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL;
