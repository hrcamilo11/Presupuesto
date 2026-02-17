-- Asegura que last_four_digits existe
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS last_four_digits TEXT;

-- Añade campos para lógica de inversión
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS investment_yield_rate NUMERIC DEFAULT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS investment_term TEXT DEFAULT NULL;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS investment_start_date DATE DEFAULT NULL;

COMMENT ON COLUMN public.wallets.investment_yield_rate IS 'Tasa de rendimiento de la inversión (% mensual o anual según se defina).';
COMMENT ON COLUMN public.wallets.investment_term IS 'Plazo de la inversión (ej: 90 días, 1 año).';
COMMENT ON COLUMN public.wallets.investment_start_date IS 'Fecha en la que inició la inversión.';
