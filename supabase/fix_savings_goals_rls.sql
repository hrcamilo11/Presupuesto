-- Standalone fix for savings_goals RLS policy
-- Execute this in Supabase SQL Editor

-- First, drop ALL existing INSERT policies for savings_goals
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'savings_goals' 
        AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.savings_goals', pol.policyname);
    END LOOP;
END $$;

-- Now create the correct INSERT policy
CREATE POLICY "Users can insert savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (shared_account_id IS NOT NULL AND shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid())))
  );
