-- ============================================================
-- Nurai AI Studio — Card Templates Table
--
-- Moves hardcoded card template list from lib/card-templates.ts
-- into the database so templates can be managed without deploys.
-- ============================================================

CREATE TABLE IF NOT EXISTS card_templates (
  id          text        PRIMARY KEY,          -- e.g. 'tpl-01'
  name        text        NOT NULL,
  category    text        NOT NULL
              CHECK (category IN ('marketplace','lifestyle','minimal','luxury')),
  image_url   text        NOT NULL,             -- relative to /public, e.g. '/exCardTemplate/1.webp'
  label       text,
  is_premium  boolean     NOT NULL DEFAULT false,
  sort_order  integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Row Level Security ─────────────────────────────────────
ALTER TABLE card_templates ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active templates
CREATE POLICY "card_templates_select_active"
  ON card_templates FOR SELECT
  USING (is_active = true);

-- ── Seed data (mirrors former CARD_TEMPLATES in lib/card-templates.ts) ─────
INSERT INTO card_templates (id, name, category, image_url, sort_order) VALUES
  ('tpl-01', 'Шаблон 1',  'marketplace', '/exCardTemplate/1.webp',           1),
  ('tpl-02', 'Шаблон 2',  'marketplace', '/exCardTemplate/1%20(1).webp',     2),
  ('tpl-03', 'Шаблон 3',  'marketplace', '/exCardTemplate/1%20(2).webp',     3),
  ('tpl-04', 'Шаблон 4',  'marketplace', '/exCardTemplate/1%20(4).webp',     4),
  ('tpl-05', 'Шаблон 5',  'marketplace', '/exCardTemplate/1%20(5).webp',     5),
  ('tpl-06', 'Шаблон 6',  'marketplace', '/exCardTemplate/1%20(6).webp',     6),
  ('tpl-07', 'Шаблон 7',  'marketplace', '/exCardTemplate/1%20(7).webp',     7),
  ('tpl-08', 'Шаблон 8',  'marketplace', '/exCardTemplate/1%20(8).webp',     8),
  ('tpl-09', 'Шаблон 9',  'marketplace', '/exCardTemplate/1%20(9).webp',     9),
  ('tpl-10', 'Шаблон 10', 'marketplace', '/exCardTemplate/1%20(10).webp',   10),
  ('tpl-11', 'Шаблон 11', 'marketplace', '/exCardTemplate/1%20(11).webp',   11),
  ('tpl-12', 'Шаблон 12', 'marketplace', '/exCardTemplate/1%20(12).webp',   12),
  ('tpl-13', 'Шаблон 13', 'lifestyle',   '/exCardTemplate/3.webp',           13),
  ('tpl-14', 'Шаблон 14', 'lifestyle',   '/exCardTemplate/3%20(1).webp',    14),
  ('tpl-15', 'Шаблон 15', 'minimal',     '/exCardTemplate/16966461.jpeg',   15),
  ('tpl-16', 'Шаблон 16', 'minimal',     '/exCardTemplate/42262946.jpg',    16),
  ('tpl-17', 'Шаблон 17', 'minimal',     '/exCardTemplate/65762494.jpg',    17),
  ('tpl-18', 'Шаблон 18', 'minimal',     '/exCardTemplate/67520454.jpeg',   18),
  ('tpl-19', 'Шаблон 19', 'minimal',     '/exCardTemplate/69281824.jpg',    19),
  ('tpl-20', 'Шаблон 20', 'luxury',      '/exCardTemplate/82630358.jpeg',   20),
  ('tpl-21', 'Шаблон 21', 'luxury',      '/exCardTemplate/86404261117982.jpg',  21),
  ('tpl-22', 'Шаблон 22', 'luxury',      '/exCardTemplate/86492964225054.jpeg', 22),
  ('tpl-23', 'Шаблон 23', 'luxury',      '/exCardTemplate/86668728434718.jpg',  23),
  ('tpl-24', 'Шаблон 24', 'luxury',      '/exCardTemplate/95278492.jpeg',   24),
  ('tpl-25', 'Шаблон 25', 'luxury',      '/exCardTemplate/99432248.jpeg',   25),
  ('tpl-26', 'Шаблон 26', 'lifestyle',   '/exCardTemplate/107072579.jpg',   26),
  ('tpl-27', 'Шаблон 27', 'lifestyle',   '/exCardTemplate/115446052.jpg',   27)
ON CONFLICT (id) DO NOTHING;
