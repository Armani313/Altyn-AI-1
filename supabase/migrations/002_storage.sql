-- ============================================================
-- Luminify — Storage Buckets + Policies
--
-- Run AFTER 001_init.sql.
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Buckets ──────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'jewelry-uploads',
    'jewelry-uploads',
    false,                   -- private: accessed via signed URLs only
    10485760,                -- 10 MB
    ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
  ),
  (
    'generated-images',
    'generated-images',
    true,                    -- public: output images are served directly
    10485760,
    ARRAY['image/jpeg','image/png','image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ─────────────────────────────────────

-- jewelry-uploads: each user can only read/write their own folder
-- Path format: {user_id}/{timestamp}-source.jpg
CREATE POLICY "uploads_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'jewelry-uploads'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "uploads_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'jewelry-uploads'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "uploads_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'jewelry-uploads'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- generated-images: public bucket — reads need no policy (public=true)
-- but writes are still scoped to the owner's folder
CREATE POLICY "results_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
