-- Día de pago para tarjetas de crédito (1-31). Por defecto muchos bancos usan corte+20 o un día fijo.
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS payment_due_day INTEGER CHECK (payment_due_day >= 1 AND payment_due_day <= 31);

COMMENT ON COLUMN public.wallets.payment_due_day IS 'Día del mes en que vence el pago de la tarjeta (1-31).';

-- Transferencias hacia/d desde crédito: en crédito el balance es deuda.
-- Al transferir A una tarjeta de crédito = pago (reducir deuda).
-- Al transferir DESDE una tarjeta = avance (aumentar deuda).
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
    v_from_type TEXT;
    v_to_type TEXT;
    v_user_id UUID;
    v_credit_limit DECIMAL;
BEGIN
    SELECT user_id, balance, type, credit_limit
    INTO v_user_id, v_from_balance, v_from_type, v_credit_limit
    FROM public.wallets
    WHERE id = p_from_wallet_id;

    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Source wallet not found'; END IF;
    IF v_user_id <> auth.uid() THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    IF v_from_type = 'credit' THEN
        -- En crédito, balance = deuda. Disponible = cupo - deuda. No permitir transferir más de lo disponible.
        IF (COALESCE(v_credit_limit, 0) - v_from_balance) < p_amount THEN
            RAISE EXCEPTION 'Insufficient available credit in source wallet';
        END IF;
    ELSE
        IF v_from_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds in source wallet'; END IF;
    END IF;

    SELECT type INTO v_to_type FROM public.wallets WHERE id = p_to_wallet_id;
    IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_to_wallet_id AND user_id = v_user_id) THEN
        RAISE EXCEPTION 'Destination wallet not found or belongs to different user';
    END IF;

    INSERT INTO public.wallet_transfers (user_id, from_wallet_id, to_wallet_id, amount, description)
    VALUES (v_user_id, p_from_wallet_id, p_to_wallet_id, p_amount, p_description)
    RETURNING id INTO v_transfer_id;

    -- Origen: crédito => aumentar deuda (balance +). Normal => restar (balance -).
    UPDATE public.wallets
    SET balance = CASE WHEN type = 'credit' THEN balance + p_amount ELSE balance - p_amount END,
        updated_at = NOW()
    WHERE id = p_from_wallet_id;

    -- Destino: crédito => pago, reducir deuda (balance -). Normal => sumar (balance +).
    UPDATE public.wallets
    SET balance = CASE WHEN type = 'credit' THEN balance - p_amount ELSE balance + p_amount END,
        updated_at = NOW()
    WHERE id = p_to_wallet_id;

    RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
