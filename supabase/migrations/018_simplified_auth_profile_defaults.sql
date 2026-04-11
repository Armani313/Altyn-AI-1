-- Simplified auth flow: email/password signups no longer provide extra profile fields.
-- Seed a sensible display name from email and keep optional fields nullable.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (
    id,
    business_name,
    contact_name,
    phone,
    avatar_url,
    email,
    credits_remaining
  )
  VALUES (
    NEW.id,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'business_name', ''), ''),
    NULLIF(
      COALESCE(
        NEW.raw_user_meta_data->>'contact_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(COALESCE(NEW.email, ''), '@', 1)
      ),
      ''
    ),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), ''),
    NEW.email,
    5
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
