-- Veo Fast default pricing: 8s / 720p now costs 12 credits.
ALTER TABLE public.video_generations
ALTER COLUMN credits_charged SET DEFAULT 12;
