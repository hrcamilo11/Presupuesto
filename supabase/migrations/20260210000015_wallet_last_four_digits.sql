-- Últimos 4 dígitos de la tarjeta/cuenta (opcional, para mostrar en la tarjeta como •••• 1234)
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS last_four_digits TEXT DEFAULT NULL;

COMMENT ON COLUMN public.wallets.last_four_digits IS 'Últimos 4 dígitos de la tarjeta/cuenta para identificación (ej: 5543). Solo visual.';
