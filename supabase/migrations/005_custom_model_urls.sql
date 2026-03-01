-- ── 005_custom_model_urls.sql ─────────────────────────────────────────────────
-- Replace single custom_model_url with an array custom_model_urls (up to 5).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_model_urls TEXT[] DEFAULT '{}';

-- Migrate existing data
UPDATE profiles
SET custom_model_urls = ARRAY[custom_model_url]
WHERE custom_model_url IS NOT NULL
  AND custom_model_url <> '';

ALTER TABLE profiles
  DROP COLUMN IF EXISTS custom_model_url;
