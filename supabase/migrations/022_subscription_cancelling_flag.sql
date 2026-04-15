-- ============================================================
-- Migration 022 — subscription cancel-at-period-end flag
--
-- Goal (from subscription audit 2026-04-16):
--   MED-3: `subscription.canceled` from Polar is scheduled-cancel —
--          the subscription remains active until the period ends
--          and `subscription.revoked` fires. Until now we only
--          logged the event so users had no UI feedback that their
--          cancel was registered.
--
--   This migration adds a flag on subscriptions that the webhook
--   can flip when `subscription.canceled` fires, and the billing
--   UI can render as a "cancellation pending" banner.
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS
  'True when Polar has scheduled a cancellation for the end of the current '
  'period. The subscription stays status=active until subscription.revoked '
  'fires, so the app keeps serving paid features until that point.';

-- Partial index: we only care about rows awaiting revocation for UI queries.
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancel_at_period_end
  ON public.subscriptions (user_id)
  WHERE cancel_at_period_end = true;
