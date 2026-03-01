-- ── 004_user_models.sql ──────────────────────────────────────────────────────
-- Add custom model photo URL to user profiles.
-- Users can upload one custom model photo that persists across sessions.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_model_url TEXT;

-- Allow users to update their own custom_model_url (via existing RLS policy).
-- The security trigger from 003_security.sql only blocks plan/credits_remaining,
-- so custom_model_url can be updated freely by the row owner.
