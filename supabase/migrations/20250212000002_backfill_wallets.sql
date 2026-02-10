-- Backfill existing incomes and expenses to use the default 'Efectivo' wallet if wallet_id is NULL

DO $$
DECLARE
  u RECORD;
  v_wallet_id UUID;
BEGIN
  FOR u IN SELECT id FROM auth.users LOOP
    -- Get the 'Efectivo' wallet for the user
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = u.id AND name = 'Efectivo' LIMIT 1;

    -- If found, update records
    IF v_wallet_id IS NOT NULL THEN
      UPDATE public.incomes SET wallet_id = v_wallet_id WHERE user_id = u.id AND wallet_id IS NULL;
      UPDATE public.expenses SET wallet_id = v_wallet_id WHERE user_id = u.id AND wallet_id IS NULL;
    END IF;
  END LOOP;
END $$;
