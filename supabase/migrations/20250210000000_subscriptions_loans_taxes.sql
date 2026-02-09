-- Frecuencia para suscripciones
CREATE TYPE subscription_frequency AS ENUM ('monthly', 'yearly');

-- Suscripciones (Netflix, gym, etc.)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  frequency subscription_frequency NOT NULL DEFAULT 'monthly',
  next_due_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Préstamos
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  principal DECIMAL(12, 2) NOT NULL CHECK (principal > 0),
  annual_interest_rate DECIMAL(6, 4) NOT NULL CHECK (annual_interest_rate >= 0),
  term_months INTEGER NOT NULL CHECK (term_months > 0),
  start_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos de préstamos (registro de cada pago)
CREATE TABLE public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  paid_at DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  principal_portion DECIMAL(12, 2) NOT NULL CHECK (principal_portion >= 0),
  interest_portion DECIMAL(12, 2) NOT NULL CHECK (interest_portion >= 0),
  balance_after DECIMAL(12, 2) NOT NULL CHECK (balance_after >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Obligaciones fiscales (impuestos estimados o pagos con vencimiento)
CREATE TYPE tax_period_type AS ENUM ('monthly', 'quarterly', 'yearly');

CREATE TABLE public.tax_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  period_type tax_period_type NOT NULL DEFAULT 'yearly',
  due_date DATE NOT NULL,
  paid_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opcional: vincular gasto a suscripción (para historial)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS loan_payment_id UUID REFERENCES public.loan_payments(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own loans"
  ON public.loans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own loan_payments via loan"
  ON public.loan_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own tax_obligations"
  ON public.tax_obligations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_subscriptions_user_next ON public.subscriptions(user_id, next_due_date);
CREATE INDEX idx_loans_user ON public.loans(user_id);
CREATE INDEX idx_loan_payments_loan ON public.loan_payments(loan_id, payment_number);
CREATE INDEX idx_tax_obligations_user_due ON public.tax_obligations(user_id, due_date);
