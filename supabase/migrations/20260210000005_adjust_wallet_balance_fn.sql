-- Helper function to adjust wallet balances atomically

CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_wallet_id UUID,
  p_delta DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + p_delta,
      updated_at = NOW()
  WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

