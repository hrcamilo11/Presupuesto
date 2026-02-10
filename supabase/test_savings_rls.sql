-- Test script to verify RLS policy for personal savings goals
-- Run this in Supabase SQL Editor to test if the policy works

-- First, check what user_id the current session has
SELECT auth.uid() as current_user_id;

-- Try to insert a test savings goal (this should work if RLS is correct)
INSERT INTO public.savings_goals (user_id, name, target_amount, type, shared_account_id)
VALUES (auth.uid(), 'Test Goal', 100000, 'manual', NULL)
RETURNING *;

-- If the above works, delete the test goal
DELETE FROM public.savings_goals WHERE name = 'Test Goal' AND user_id = auth.uid();
