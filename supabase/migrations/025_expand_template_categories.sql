-- Migration: expand template categories for clothing mannequins
-- Adds 'outerwear' and 'bottomwear' to the templates.category CHECK constraint

ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_check;
ALTER TABLE templates ADD CONSTRAINT templates_category_check
  CHECK (category IN ('rings','necklaces','bracelets','earrings','universal','outerwear','bottomwear'));
