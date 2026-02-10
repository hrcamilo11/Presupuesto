-- FINAL FIXES FOR SHARED ACCOUNTS RLS AND JOIN LOGIC

-- 1. Drop old problematic policies
DROP POLICY IF EXISTS "Members can view members of same account" ON public.shared_account_members;
DROP POLICY IF EXISTS "Owner can insert members" ON public.shared_account_members;
DROP POLICY IF EXISTS "Owner can delete members" ON public.shared_account_members;
DROP POLICY IF EXISTS "Members can view shared account" ON public.shared_accounts;
DROP POLICY IF EXISTS "Owner can update shared account" ON public.shared_accounts;
DROP POLICY IF EXISTS "Owner can delete shared account" ON public.shared_accounts;

-- 2. Refined helper functions (SECURITY DEFINER to break recursion)
CREATE OR REPLACE FUNCTION public.user_shared_account_ids(uid UUID)
RETURNS SETOF UUID AS $$
  -- Accounts where user is a member
  SELECT shared_account_id FROM public.shared_account_members WHERE user_id = uid
  UNION
  -- Accounts created by user
  SELECT id FROM public.shared_accounts WHERE created_by = uid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_shared_account_owner(p_account_id UUID, p_uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_account_members 
    WHERE shared_account_id = p_account_id AND user_id = p_uid AND role = 'owner'
  ) OR EXISTS (
    SELECT 1 FROM public.shared_accounts
    WHERE id = p_account_id AND created_by = p_uid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Re-create Shared Account Members Policies
CREATE POLICY "Members can view members of same account"
  ON public.shared_account_members FOR SELECT
  USING (
    user_id = auth.uid() 
    OR shared_account_id IN (SELECT public.user_shared_account_ids(auth.uid()))
  );

CREATE POLICY "Owners can manage members"
  ON public.shared_account_members FOR ALL
  USING (public.is_shared_account_owner(shared_account_id, auth.uid()))
  WITH CHECK (public.is_shared_account_owner(shared_account_id, auth.uid()));

CREATE POLICY "Anyone can leave"
  ON public.shared_account_members FOR DELETE
  USING (user_id = auth.uid());

-- 4. Re-create Shared Accounts Policies
CREATE POLICY "Members can view shared account"
  ON public.shared_accounts FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (SELECT public.user_shared_account_ids(auth.uid()))
  );

CREATE POLICY "Users can create shared accounts"
  ON public.shared_accounts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can manage shared account"
  ON public.shared_accounts FOR ALL
  USING (public.is_shared_account_owner(id, auth.uid()))
  WITH CHECK (public.is_shared_account_owner(id, auth.uid()));

-- 5. SECURE JOIN FUNCTIONS (RPC)
-- This allows joining without needing SELECT permission on the account/invite first.
CREATE OR REPLACE FUNCTION public.join_shared_account_by_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_member_count INTEGER;
BEGIN
    -- 1. Find the account (SECURITY DEFINER lets us bypass RLS for this lookup)
    SELECT id INTO v_account_id FROM public.shared_accounts WHERE UPPER(invite_code) = UPPER(p_code);
    IF v_account_id IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;

    -- 2. Check if already a member
    IF EXISTS (SELECT 1 FROM public.shared_account_members WHERE shared_account_id = v_account_id AND user_id = auth.uid()) THEN
        RETURN v_account_id;
    END IF;

    -- 3. Check limit
    SELECT COUNT(*) INTO v_member_count FROM public.shared_account_members WHERE shared_account_id = v_account_id;
    IF v_member_count >= 5 THEN RAISE EXCEPTION 'Shared account is full (max 5 members)'; END IF;

    -- 4. Join
    INSERT INTO public.shared_account_members (shared_account_id, user_id, role)
    VALUES (v_account_id, auth.uid(), 'member');

    RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.accept_shared_account_invite(p_token TEXT)
RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
    v_invite_id UUID;
    v_member_count INTEGER;
BEGIN
    -- 1. Find invite and validate
    SELECT id, shared_account_id INTO v_invite_id, v_account_id 
    FROM public.shared_account_invites 
    WHERE token = p_token AND expires_at > NOW();
    
    IF v_invite_id IS NULL THEN RAISE EXCEPTION 'Invite link is invalid or expired'; END IF;

    -- 2. Check if already a member
    IF EXISTS (SELECT 1 FROM public.shared_account_members WHERE shared_account_id = v_account_id AND user_id = auth.uid()) THEN
        RETURN v_account_id;
    END IF;

    -- 3. Check limit
    SELECT COUNT(*) INTO v_member_count FROM public.shared_account_members WHERE shared_account_id = v_account_id;
    IF v_member_count >= 5 THEN RAISE EXCEPTION 'Shared account is full (max 5 members)'; END IF;

    -- 4. Join
    INSERT INTO public.shared_account_members (shared_account_id, user_id, role)
    VALUES (v_account_id, auth.uid(), 'member');

    -- 5. Cleanup invite
    DELETE FROM public.shared_account_invites WHERE id = v_invite_id;

    RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
