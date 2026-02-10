-- Add invite_code to shared_accounts
ALTER TABLE public.shared_accounts ADD COLUMN invite_code TEXT UNIQUE;

-- Index for fast lookup by code
CREATE INDEX idx_shared_accounts_invite_code ON public.shared_accounts(invite_code);

-- Backfill existing accounts with a random code
-- We use a simple random string generation here for backfill
UPDATE public.shared_accounts
SET invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE invite_code IS NULL;

-- Make it clear it shouldn't be null after backfill (optional, but good practice)
ALTER TABLE public.shared_accounts ALTER COLUMN invite_code SET NOT NULL;
