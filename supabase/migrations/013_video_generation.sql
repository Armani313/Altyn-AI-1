-- ============================================================
-- Migration 013 — Video generation from image
--
-- Adds:
--   - video_templates catalog
--   - video_generations history table
--   - generated-videos storage bucket
-- ============================================================

CREATE TABLE IF NOT EXISTS public.video_templates (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  description     text,
  cover_image_url text        NOT NULL,
  demo_video_url  text        NOT NULL,
  prompt_template text        NOT NULL,
  aspect_ratio    text        NOT NULL CHECK (aspect_ratio IN ('9:16')),
  label           text,
  is_premium      boolean     NOT NULL DEFAULT false,
  is_active       boolean     NOT NULL DEFAULT true,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_generations (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  video_template_id       text        REFERENCES public.video_templates(id) ON DELETE SET NULL,
  input_image_url         text        NOT NULL,
  output_video_url        text,
  status                  text        NOT NULL DEFAULT 'queued'
                                      CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  provider                text        NOT NULL DEFAULT 'veo-3.1',
  provider_operation_name text,
  credits_charged         integer     NOT NULL DEFAULT 5 CHECK (credits_charged >= 0),
  error_message           text,
  metadata                jsonb       NOT NULL DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_generations_user_id
  ON public.video_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_video_generations_status
  ON public.video_generations(status);

CREATE INDEX IF NOT EXISTS idx_video_generations_created_at
  ON public.video_generations(created_at DESC);

CREATE OR REPLACE TRIGGER set_updated_at_video_generations
  BEFORE UPDATE ON public.video_generations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_templates_select_active"
  ON public.video_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "video_generations_select_own"
  ON public.video_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "video_generations_insert_own"
  ON public.video_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "video_generations_update_own"
  ON public.video_generations FOR UPDATE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-videos',
  'generated-videos',
  true,
  52428800,
  ARRAY['video/mp4']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "generated_videos_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "generated_videos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-videos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

INSERT INTO public.video_templates (
  id,
  name,
  description,
  cover_image_url,
  demo_video_url,
  prompt_template,
  aspect_ratio,
  label,
  sort_order
) VALUES
  (
    'rotation',
    'Rotation',
    'Slow luxury orbit around the product with clean studio motion.',
    '/after1.png',
    '/after2.mp4',
    'Create a premium vertical product motion reel from the provided product image. Preserve the exact product design, stones, metal color, finish, proportions, and texture. The video should feel like a refined studio orbit: gentle three-quarter camera rotation, subtle parallax, controlled shadow movement, glossy highlights, and a minimal premium background. No hands, no people, no text, no brand marks, no extra props, and no redesign of the product.',
    '9:16',
    'Popular',
    1
  ),
  (
    'macro-sparkle',
    'Macro Sparkle',
    'Close-up luxury macro movement with sparkle and sharp detail.',
    '/after1.png',
    '/after2.mp4',
    'Generate a vertical macro luxury video from the provided product image. Keep the product identical to the source in every detail. Use slow cinematic macro push-ins, tiny focus shifts, refined sparkle on reflective surfaces, and elegant motion lighting that makes the jewelry feel premium and tactile. No people, no fingers, no added gems, no text, no packaging, and no product redesign.',
    '9:16',
    'Luxury',
    2
  ),
  (
    'floating-packshot',
    'Floating Packshot',
    'Clean floating product shot with subtle motion and soft gradients.',
    '/after1.png',
    '/after2.mp4',
    'Turn the provided product image into a vertical floating packshot reel. Preserve the exact product appearance. Animate the product as if it is suspended in a premium studio scene with soft vertical drift, tasteful camera sway, and smooth gradient light transitions. The look should be clean, elevated, and marketplace-ready. Do not add hands, models, text, boxes, or decorative clutter.',
    '9:16',
    'Clean',
    3
  ),
  (
    'shadow-sweep',
    'Shadow Sweep',
    'Editorial sweep of light and shadow across the product.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical editorial video from the provided product image where the product stays identical to the source. Use a dramatic but elegant sweep of light and shadow across the scene, subtle camera movement, and high-end contrast to create a premium advertisement feel. No people, no text overlays, no extra products, and no changes to the product''s design.',
    '9:16',
    'Editorial',
    4
  ),
  (
    'light-streak-luxury',
    'Light Streak Luxury',
    'Glossy luxury reveal with dynamic streaks of light.',
    '/after1.png',
    '/after2.mp4',
    'Generate a vertical luxury reveal reel from the provided product image. Preserve the exact product details. The motion should focus on elegant light streaks gliding across the product, polished reflections, and a confident premium reveal suitable for social ads. Keep the environment minimal and sophisticated. No people, no captions, no brand text, and no product alteration.',
    '9:16',
    'New',
    5
  ),
  (
    'kinetic-gradient',
    'Kinetic Gradient',
    'Modern motion background with gentle kinetic movement.',
    '/after1.png',
    '/after2.mp4',
    'Create a sleek vertical product reel from the provided image. Keep the product exactly the same as the source. Use a kinetic modern gradient background, soft camera motion, subtle floating movement, and crisp luxury lighting so the product feels contemporary and premium. No human subjects, no hands, no text, no logos, and no redesign or substitution of the product.',
    '9:16',
    'Modern',
    6
  )
ON CONFLICT (id) DO NOTHING;
