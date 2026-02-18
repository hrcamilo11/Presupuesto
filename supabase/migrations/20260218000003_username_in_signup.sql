-- Update handle_new_user trigger to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      -- fallback to a part of email if not provided, just in case
      SPLIT_PART(NEW.email, '@', 1) || '_' || CAST(FLOOR(RANDOM() * 1000000) AS TEXT)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
