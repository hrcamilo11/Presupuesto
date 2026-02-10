-- Make adjust_wallet_balance aware of credit wallets.
-- For normal wallets, p_delta works as "cash" (income +, expense -).
-- For credit wallets, balance represents debt used:
--   - Income (payment) should REDUCE debt  => balance = balance - p_delta
--   - Expense (purchase) passes negative p_delta, so debt INCREASES.

CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
  p_wallet_id UUID,
  p_delta     DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets
  SET
    balance = CASE
      WHEN type = 'credit' THEN balance - p_delta
      ELSE balance + p_delta
    END,
    updated_at = NOW()
  WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

