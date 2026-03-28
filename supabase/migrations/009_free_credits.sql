-- ── Migration 009: update free plan credits ──────────────────────────────────
-- Free plan: 3 → 5 credits on signup
-- Starter plan: 30 → 20 credits (reflected in app code, no DB change needed)

ALTER TABLE profiles
  ALTER COLUMN credits_remaining SET DEFAULT 5;
