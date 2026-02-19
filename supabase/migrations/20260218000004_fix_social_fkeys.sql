-- Migration: Fix social and collections foreign keys to target public.profiles
-- This ensures that Supabase can join these tables with the profiles table correctly for social features.

BEGIN;

-- 1. Fix friends table
-- Temporarily drop the current constraints that point to auth.users
ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_user_id_fkey;
ALTER TABLE public.friends ADD CONSTRAINT friends_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.friends DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;
ALTER TABLE public.friends ADD CONSTRAINT friends_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Fix collections table
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_creditor_id_fkey;
ALTER TABLE public.collections ADD CONSTRAINT collections_creditor_id_fkey FOREIGN KEY (creditor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_debtor_id_fkey;
ALTER TABLE public.collections ADD CONSTRAINT collections_debtor_id_fkey FOREIGN KEY (debtor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMIT;
