-- ── Migration: handle Google OAuth profiles ──────────────────
-- Google users have `full_name` and `avatar_url` in metadata
-- but no `business_name`, `contact_name`, or `phone`.
-- Updated trigger uses COALESCE to handle both flows gracefully.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, business_name, contact_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'business_name',
      NEW.raw_user_meta_data->>'full_name',
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'contact_name',
      NEW.raw_user_meta_data->>'full_name',
      ''
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
