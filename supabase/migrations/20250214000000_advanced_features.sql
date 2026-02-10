-- 1. Wallet Transfers Table
CREATE TABLE IF NOT EXISTS public.wallet_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    to_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_wallets CHECK (from_wallet_id <> to_wallet_id)
);

ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transfers"
    ON public.wallet_transfers FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Savings Plans (Recurring Savings)
CREATE TYPE savings_frequency AS ENUM ('weekly', 'monthly');

CREATE TABLE IF NOT EXISTS public.savings_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    savings_goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    frequency savings_frequency NOT NULL DEFAULT 'monthly',
    day_of_period INTEGER NOT NULL, -- 1-7 for weekly, 1-31 for monthly
    last_executed TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings plans"
    ON public.savings_plans FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Atomic Function for Wallet Transfer
CREATE OR REPLACE FUNCTION public.transfer_between_wallets(
    p_from_wallet_id UUID,
    p_to_wallet_id UUID,
    p_amount DECIMAL,
    p_description TEXT
)
RETURNS UUID AS $$
DECLARE
    v_transfer_id UUID;
    v_from_balance DECIMAL;
    v_user_id UUID;
BEGIN
    -- Get user_id and current balance
    SELECT user_id, balance INTO v_user_id, v_from_balance 
    FROM public.wallets 
    WHERE id = p_from_wallet_id;

    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Source wallet not found'; END IF;
    IF v_user_id <> auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    IF v_from_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds in source wallet'; END IF;

    -- Ensure destination belongs to the same user (or handled by RLS, but explicit is better)
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_to_wallet_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'Destination wallet not found or belongs to different user';
    END IF;

    -- Insert transfer log
    INSERT INTO public.wallet_transfers (user_id, from_wallet_id, to_wallet_id, amount, description)
    VALUES (v_user_id, p_from_wallet_id, p_to_wallet_id, p_amount, p_description)
    RETURNING id INTO v_transfer_id;

    -- Update balances
    UPDATE public.wallets SET balance = balance - p_amount, updated_at = NOW() WHERE id = p_from_wallet_id;
    UPDATE public.wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = p_to_wallet_id;

    RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
