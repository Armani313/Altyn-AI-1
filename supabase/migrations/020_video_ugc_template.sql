DO $$
BEGIN
  IF to_regclass('public.video_templates') IS NULL THEN
    RAISE EXCEPTION 'public.video_templates does not exist. Apply 013_video_generation.sql first.';
  END IF;
END $$;

INSERT INTO public.video_templates (
  id,
  name,
  description,
  cover_image_url,
  demo_video_url,
  prompt_template,
  aspect_ratio,
  label,
  sort_order,
  is_premium,
  is_active
) VALUES
  (
    'ugc-talking-head',
    'UGC Talking Head',
    'Selfie-style creator review with direct-to-camera delivery and realistic product handling.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical talking-head UGC video from the uploaded product image. The product must stay identical to the source image while a creator speaks directly to camera, shows the product naturally, and delivers an authentic recommendation.',
    '9:16',
    'UGC',
    1,
    false,
    true
  ),
  (
    'ugc-tutorial',
    'Tutorial / How-To',
    'Creator-led how-to with one clear usage step and a practical takeaway.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical tutorial-style UGC video from the uploaded product image. A creator explains how to use the product in quick clear steps, shows one believable interaction, and keeps the product identical to the source image.',
    '9:16',
    'How-to',
    2,
    false,
    true
  ),
  (
    'ugc-unboxing',
    'Unboxing Reveal',
    'First-reveal format with casual creator energy, honest reaction, and a clean product reveal.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical unboxing-style UGC video from the uploaded product image. Focus on first-reveal energy, authentic surprise, and a casual home-recorded feel. If packaging is not visible in the source, use only simple neutral wrapping with no branding and keep the product identical to the uploaded image.',
    '9:16',
    'Reveal',
    3,
    false,
    true
  ),
  (
    'ugc-problem-solution',
    'Problem / Solution',
    'Pain-point hook that introduces the product as the answer and closes on the payoff.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical problem-solution UGC video from the uploaded product image. The creator should open with a relatable pain point, present the product as the answer, demonstrate one believable support moment, and keep the product identical to the source image.',
    '9:16',
    'Hook',
    4,
    false,
    true
  ),
  (
    'ugc-benefits-list',
    '3 Benefits',
    'Fast creator rundown of the top reasons to choose the product.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical creator-style benefits list video from the uploaded product image. The creator should highlight two or three concrete reasons they like the product, counting through them naturally while keeping the product identical to the source image.',
    '9:16',
    'Benefits',
    5,
    false,
    true
  ),
  (
    'ugc-reaction-review',
    'Reaction Review',
    'Faster emotional review driven by first reaction, favorite detail, and recommendation.',
    '/after1.png',
    '/after2.mp4',
    'Create a vertical first-impression reaction review from the uploaded product image. The creator should feel genuinely impressed, speak directly to camera, call out a favorite detail, and keep the product identical to the source image.',
    '9:16',
    'Review',
    6,
    false,
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cover_image_url = EXCLUDED.cover_image_url,
  demo_video_url = EXCLUDED.demo_video_url,
  prompt_template = EXCLUDED.prompt_template,
  aspect_ratio = EXCLUDED.aspect_ratio,
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_premium = EXCLUDED.is_premium,
  is_active = EXCLUDED.is_active;

UPDATE public.video_templates
SET sort_order = CASE id
  WHEN 'ugc-talking-head' THEN 1
  WHEN 'ugc-tutorial' THEN 2
  WHEN 'ugc-unboxing' THEN 3
  WHEN 'ugc-problem-solution' THEN 4
  WHEN 'ugc-benefits-list' THEN 5
  WHEN 'ugc-reaction-review' THEN 6
  WHEN 'rotation' THEN 7
  WHEN 'macro-sparkle' THEN 8
  WHEN 'floating-packshot' THEN 9
  WHEN 'shadow-sweep' THEN 10
  WHEN 'light-streak-luxury' THEN 11
  WHEN 'kinetic-gradient' THEN 12
  ELSE sort_order
END
WHERE id IN (
  'ugc-talking-head',
  'ugc-tutorial',
  'ugc-unboxing',
  'ugc-problem-solution',
  'ugc-benefits-list',
  'ugc-reaction-review',
  'rotation',
  'macro-sparkle',
  'floating-packshot',
  'shadow-sweep',
  'light-streak-luxury',
  'kinetic-gradient'
);
