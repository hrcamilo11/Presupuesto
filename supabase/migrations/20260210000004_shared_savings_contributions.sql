-- Shared savings contributions with wallet balance validation

CREATE TABLE IF NOT EXISTS public.shared_savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_savings_goal_id UUID NOT NULL REFERENCES public.shared_savings_goals(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC to contribute to a shared savings goal, debiting from a wallet
CREATE OR REPLACE FUNCTION public.contribute_to_shared_savings(
  p_shared_goal_id UUID,
  p_wallet_id UUID,
  p_amount DECIMAL,
  p_date DATE,
  p_notes TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_wallet_balance DECIMAL;
BEGIN
  -- Check wallet balance
  SELECT balance INTO v_wallet_balance FROM public.wallets WHERE id = p_wallet_id;

  IF v_wallet_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_wallet_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds in wallet';
  END IF;

  -- Insert transaction
  INSERT INTO public.shared_savings_transactions (shared_savings_goal_id, wallet_id, amount, date, notes)
  VALUES (p_shared_goal_id, p_wallet_id, p_amount, p_date, p_notes)
  RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Update shared savings goal amount
  UPDATE public.shared_savings_goals
  SET current_amount = current_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_shared_goal_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

