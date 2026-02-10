-- Function to handle savings contribution transaction safely
CREATE OR REPLACE FUNCTION public.contribute_to_savings(
  p_savings_goal_id UUID,
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
  INSERT INTO public.savings_transactions (savings_goal_id, wallet_id, amount, date, notes)
  VALUES (p_savings_goal_id, p_wallet_id, p_amount, p_date, p_notes)
  RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  UPDATE public.wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Update savings goal amount
  UPDATE public.savings_goals
  SET current_amount = current_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_savings_goal_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
