-- Credit card specific fields for wallets

ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS credit_mode TEXT CHECK (credit_mode IN ('account', 'card')) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS card_brand TEXT,
  ADD COLUMN IF NOT EXISTS cut_off_day INTEGER CHECK (cut_off_day BETWEEN 1 AND 31),
  ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) CHECK (credit_limit >= 0),
  ADD COLUMN IF NOT EXISTS cash_advance_limit DECIMAL(12,2) CHECK (cash_advance_limit >= 0),
  ADD COLUMN IF NOT EXISTS purchase_interest_rate DECIMAL(6,4) CHECK (purchase_interest_rate >= 0),
  ADD COLUMN IF NOT EXISTS cash_advance_interest_rate DECIMAL(6,4) CHECK (cash_advance_interest_rate >= 0);

