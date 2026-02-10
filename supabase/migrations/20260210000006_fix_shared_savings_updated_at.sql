-- Ensure shared_savings_goals has an updated_at column for triggers/RPCs

ALTER TABLE public.shared_savings_goals
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

