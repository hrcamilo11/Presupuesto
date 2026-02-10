-- MIGRATION: Change main currency to COP and default timezone to Colombia

-- 1. Profiles
ALTER TABLE public.profiles ALTER COLUMN currency SET DEFAULT 'COP';
ALTER TABLE public.profiles ALTER COLUMN timezone SET DEFAULT 'America/Bogota';
UPDATE public.profiles SET currency = 'COP', timezone = 'America/Bogota' WHERE currency = 'MXN';

-- 2. Wallets
ALTER TABLE public.wallets ALTER COLUMN currency SET DEFAULT 'COP';
UPDATE public.wallets SET currency = 'COP' WHERE currency = 'MXN';

-- 3. Incomes
ALTER TABLE public.incomes ALTER COLUMN currency SET DEFAULT 'COP';
UPDATE public.incomes SET currency = 'COP' WHERE currency = 'MXN';

-- 4. Expenses
ALTER TABLE public.expenses ALTER COLUMN currency SET DEFAULT 'COP';
UPDATE public.expenses SET currency = 'COP' WHERE currency = 'MXN';

-- 5. Subscriptions
ALTER TABLE public.subscriptions ALTER COLUMN currency SET DEFAULT 'COP';
UPDATE public.subscriptions SET currency = 'COP' WHERE currency = 'MXN';

-- 6. Loans
ALTER TABLE public.loans ALTER COLUMN currency SET DEFAULT 'COP';
UPDATE public.loans SET currency = 'COP' WHERE currency = 'MXN';

-- 7. Tax Obligations
ALTER TABLE public.tax_obligations ALTER COLUMN currency SET DEFAULT 'COP';
UPDATE public.tax_obligations SET currency = 'COP' WHERE currency = 'MXN';
