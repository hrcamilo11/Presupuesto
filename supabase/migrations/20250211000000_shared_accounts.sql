-- Cuentas compartidas: varios usuarios pueden pertenecer y añadir datos a la misma cuenta.

-- Tabla de cuentas compartidas
CREATE TABLE public.shared_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Miembros de una cuenta compartida (quién puede ver y editar)
CREATE TABLE public.shared_account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_account_id UUID NOT NULL REFERENCES public.shared_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shared_account_id, user_id)
);

-- Invitaciones por enlace (token en URL para unirse)
CREATE TABLE public.shared_account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_account_id UUID NOT NULL REFERENCES public.shared_accounts(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir columna opcional a tablas de datos: si es NULL = personal, si tiene valor = pertenece a esa cuenta compartida
ALTER TABLE public.incomes
  ADD COLUMN shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

ALTER TABLE public.expenses
  ADD COLUMN shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions
  ADD COLUMN shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

ALTER TABLE public.loans
  ADD COLUMN shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

ALTER TABLE public.tax_obligations
  ADD COLUMN shared_account_id UUID REFERENCES public.shared_accounts(id) ON DELETE CASCADE;

-- Índices para filtrar por cuenta compartida
CREATE INDEX idx_incomes_shared ON public.incomes(shared_account_id) WHERE shared_account_id IS NOT NULL;
CREATE INDEX idx_expenses_shared ON public.expenses(shared_account_id) WHERE shared_account_id IS NOT NULL;
CREATE INDEX idx_subscriptions_shared ON public.subscriptions(shared_account_id) WHERE shared_account_id IS NOT NULL;
CREATE INDEX idx_loans_shared ON public.loans(shared_account_id) WHERE shared_account_id IS NOT NULL;
CREATE INDEX idx_tax_obligations_shared ON public.tax_obligations(shared_account_id) WHERE shared_account_id IS NOT NULL;

CREATE INDEX idx_shared_account_members_user ON public.shared_account_members(user_id);
CREATE INDEX idx_shared_account_invites_token ON public.shared_account_invites(token);
CREATE INDEX idx_shared_account_invites_account ON public.shared_account_invites(shared_account_id);

-- Trigger: al crear una cuenta compartida, el creador se añade como miembro owner
CREATE OR REPLACE FUNCTION public.handle_shared_account_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.shared_account_members (shared_account_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_shared_account_created
  AFTER INSERT ON public.shared_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_shared_account_created();

-- RLS para shared_accounts
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view shared account"
  ON public.shared_accounts FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_accounts.id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "User can create shared account"
  ON public.shared_accounts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner can update shared account"
  ON public.shared_accounts FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_accounts.id AND m.user_id = auth.uid() AND m.role = 'owner'
    )
  );

CREATE POLICY "Owner can delete shared account"
  ON public.shared_accounts FOR DELETE
  USING (created_by = auth.uid());

-- RLS para shared_account_members
ALTER TABLE public.shared_account_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view members of same account"
  ON public.shared_account_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_account_members m2
      WHERE m2.shared_account_id = shared_account_members.shared_account_id AND m2.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert members"
  ON public.shared_account_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_accounts sa
      WHERE sa.id = shared_account_members.shared_account_id AND sa.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_members.shared_account_id AND m.user_id = auth.uid() AND m.role = 'owner'
    )
  );

CREATE POLICY "Owner can delete members"
  ON public.shared_account_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_accounts sa
      WHERE sa.id = shared_account_members.shared_account_id AND sa.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_members.shared_account_id AND m.user_id = auth.uid() AND m.role = 'owner'
    )
  );

-- RLS para shared_account_invites
ALTER TABLE public.shared_account_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invites of their account"
  ON public.shared_account_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_invites.shared_account_id AND m.user_id = auth.uid()
    )
    OR invited_by = auth.uid()
  );

CREATE POLICY "Owner/member can create invite"
  ON public.shared_account_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_invites.shared_account_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Creator can delete invite"
  ON public.shared_account_invites FOR DELETE
  USING (invited_by = auth.uid());

-- Función auxiliar: devuelve los shared_account_id donde el usuario es miembro
CREATE OR REPLACE FUNCTION public.user_shared_account_ids(uid UUID)
RETURNS SETOF UUID AS $$
  SELECT shared_account_id FROM public.shared_account_members WHERE user_id = uid
  UNION
  SELECT id FROM public.shared_accounts WHERE created_by = uid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Políticas para datos: ver/editar si es propio (user_id) o si pertenece a una cuenta compartida donde soy miembro
-- Incomes
DROP POLICY IF EXISTS "Users can manage own incomes" ON public.incomes;
CREATE POLICY "Users can view incomes (own or shared)"
  ON public.incomes FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert incomes (own or shared)"
  ON public.incomes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      shared_account_id IS NULL
      OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update incomes (own or shared)"
  ON public.incomes FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete incomes (own or shared)"
  ON public.incomes FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- Expenses
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
CREATE POLICY "Users can view expenses (own or shared)"
  ON public.expenses FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert expenses (own or shared)"
  ON public.expenses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      shared_account_id IS NULL
      OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update expenses (own or shared)"
  ON public.expenses FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete expenses (own or shared)"
  ON public.expenses FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- Subscriptions
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view subscriptions (own or shared)"
  ON public.subscriptions FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert subscriptions (own or shared)"
  ON public.subscriptions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      shared_account_id IS NULL
      OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update subscriptions (own or shared)"
  ON public.subscriptions FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete subscriptions (own or shared)"
  ON public.subscriptions FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- Loans
DROP POLICY IF EXISTS "Users can manage own loans" ON public.loans;
CREATE POLICY "Users can view loans (own or shared)"
  ON public.loans FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert loans (own or shared)"
  ON public.loans FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      shared_account_id IS NULL
      OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update loans (own or shared)"
  ON public.loans FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete loans (own or shared)"
  ON public.loans FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

-- Loan_payments: permitir si el loan es propio o compartido
DROP POLICY IF EXISTS "Users can manage own loan_payments via loan" ON public.loan_payments;
CREATE POLICY "Users can manage loan_payments (own or shared loan)"
  ON public.loan_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id
      AND (
        l.user_id = auth.uid()
        OR (l.shared_account_id IS NOT NULL AND l.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id
      AND (
        l.user_id = auth.uid()
        OR (l.shared_account_id IS NOT NULL AND l.shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
      )
    )
  );

-- Tax_obligations
DROP POLICY IF EXISTS "Users can manage own tax_obligations" ON public.tax_obligations;
CREATE POLICY "Users can view tax_obligations (own or shared)"
  ON public.tax_obligations FOR SELECT
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can insert tax_obligations (own or shared)"
  ON public.tax_obligations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      shared_account_id IS NULL
      OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can update tax_obligations (own or shared)"
  ON public.tax_obligations FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );

CREATE POLICY "Users can delete tax_obligations (own or shared)"
  ON public.tax_obligations FOR DELETE
  USING (
    user_id = auth.uid()
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );
