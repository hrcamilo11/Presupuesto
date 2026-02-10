-- Fix infinite recursion in shared_account_members RLS policy
-- The previous policy referenced itself in nested SELECT, causing a loop.

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Members can view members of same account" ON public.shared_account_members;
DROP POLICY IF EXISTS "Owner can insert members" ON public.shared_account_members;
DROP POLICY IF EXISTS "Owner can delete members" ON public.shared_account_members;

-- 2. Ensure user_shared_account_ids is up to date and correctly defined
CREATE OR REPLACE FUNCTION public.user_shared_account_ids(uid UUID)
RETURNS SETOF UUID AS $$
  -- Accounts where user is a member (Directly check the table, bypassing RLS since this is SECURITY DEFINER)
  SELECT shared_account_id FROM public.shared_account_members WHERE user_id = uid
  UNION
  -- Accounts created by user
  SELECT id FROM public.shared_accounts WHERE created_by = uid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Re-create policies using the SECURITY DEFINER function to break recursion
CREATE POLICY "Members can view members of same account"
  ON public.shared_account_members FOR SELECT
  USING (
    user_id = auth.uid() -- Basic case: always see yourself
    OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
  );

CREATE POLICY "Owner can insert members"
  ON public.shared_account_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_accounts sa
      WHERE sa.id = shared_account_members.shared_account_id 
      AND (sa.created_by = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.shared_account_members m
      WHERE m.shared_account_id = shared_account_members.shared_account_id 
      AND m.user_id = auth.uid() 
      AND m.role = 'owner'
    )
  );

-- Note: 'Owner can insert members' might still have recursion if 'm' lookup triggers SELECT policy.
-- To be safer, we can use a helper function for role check as well.

CREATE OR REPLACE FUNCTION public.is_shared_account_owner(account_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_account_members 
    WHERE shared_account_id = account_id AND user_id = uid AND role = 'owner'
  ) OR EXISTS (
    SELECT 1 FROM public.shared_accounts
    WHERE id = account_id AND created_by = uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS "Owner can insert members" ON public.shared_account_members;
CREATE POLICY "Owner can insert members"
  ON public.shared_account_members FOR INSERT
  WITH CHECK (public.is_shared_account_owner(shared_account_id, auth.uid()));

DROP POLICY IF EXISTS "Owner can delete members" ON public.shared_account_members;
CREATE POLICY "Owner can delete members"
  ON public.shared_account_members FOR DELETE
  USING (public.is_shared_account_owner(shared_account_id, auth.uid()));
