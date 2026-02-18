-- Add username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Enums
CREATE TYPE public.friend_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.collection_status AS ENUM ('pending_approval', 'active', 'rejected', 'paid', 'cancelled');

-- Friends Table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user_id ON public.friends(user_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);

-- Collections Table (Cobros/Deudas)
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creditor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'COP',
  description TEXT,
  status collection_status NOT NULL DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  CHECK (creditor_id <> debtor_id)
);

CREATE INDEX idx_collections_creditor ON public.collections(creditor_id);
CREATE INDEX idx_collections_debtor ON public.collections(debtor_id);
CREATE INDEX idx_collections_status ON public.collections(status);

-- RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Friends policies
CREATE POLICY "Users can view their own friendships"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can respond to friend requests or remove friends"
  ON public.friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Collections policies
CREATE POLICY "Users can view their own collections/debts"
  ON public.collections FOR SELECT
  USING (auth.uid() = creditor_id OR auth.uid() = debtor_id);

CREATE POLICY "Creditors can create collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = creditor_id);

CREATE POLICY "Users involved can update collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = creditor_id OR auth.uid() = debtor_id)
  WITH CHECK (auth.uid() = creditor_id OR auth.uid() = debtor_id);

-- Add updated_at trigger for new tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_friends_updated_at
  BEFORE UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Search profile by username (helpful for adding friends)
CREATE OR REPLACE FUNCTION public.search_profile_by_username(search_text TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.full_name
  FROM public.profiles p
  WHERE p.username ILIKE search_text || '%'
  LIMIT 10;
END;
$$;
