-- Disable RLS for all savings-related tables to rebuild logic cleanly.

ALTER TABLE public.savings_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_plans DISABLE ROW LEVEL SECURITY;

-- If shared_savings_goals exists, disable as well (safe if not present on some projects).
DO $$
BEGIN
  PERFORM 1 FROM pg_class WHERE relname = 'shared_savings_goals' AND relkind = 'r';
  IF FOUND THEN
    EXECUTE 'ALTER TABLE public.shared_savings_goals DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

