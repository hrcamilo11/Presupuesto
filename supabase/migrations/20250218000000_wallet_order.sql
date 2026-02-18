-- Add display_order column to wallets table
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Optional: Initialize display_order based on created_at for existing wallets
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as row_num
  FROM public.wallets
)
UPDATE public.wallets
SET display_order = ordered.row_num
FROM ordered
WHERE public.wallets.id = ordered.id;
