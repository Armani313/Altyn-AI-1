-- Migration 008: Add panel_variants JSONB column to generations
--
-- Stores the 4 split panels from a contact-sheet generation.
-- Structure per element:
--   { "id": 1, "url": "https://...", "is_upscaled": false, "upscaled_url": "https://..." }
--
-- id           1-4 (panel position: 1=top-left, 2=top-right, 3=bottom-left, 4=bottom-right)
-- url          public URL of the ~1K panel stored in Supabase Storage
-- is_upscaled  false until the user triggers upscale
-- upscaled_url set after Vertex AI Imagen upscale (4K PNG)

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS panel_variants JSONB DEFAULT NULL;

COMMENT ON COLUMN public.generations.panel_variants IS
  'For contact-sheet generations: array of 4 panel objects { id, url, is_upscaled, upscaled_url }';
