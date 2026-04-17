-- ============================================================
-- Migration 026 — Guarantee subscriptions.polar_subscription_id
--
-- Why this exists:
--   Migration 022_subscriptions_polar_cleanup.sql performs the rename
--   kaspi_order_id → polar_subscription_id conditionally. In some
--   deployment histories that migration may have been tracked as
--   applied without actually renaming the column (e.g. two files
--   with prefix `022_*` caused an ordering conflict; or the column
--   already existed under a different state). The webhook handler
--   now depends on the new name and the UNIQUE index for its
--   idempotent upsert, so we need a final unconditional guard that
--   will always run on fresh deploys.
--
-- What it does:
--   1. If only `kaspi_order_id` exists → rename it
--   2. If both names exist (shouldn't happen but be safe) → raise
--   3. Ensure UNIQUE partial index on polar_subscription_id exists
--   4. Raise if neither column is present (schema really broken)
-- ============================================================

DO $$
DECLARE
  v_has_old boolean;
  v_has_new boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'kaspi_order_id'
  ) INTO v_has_old;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'polar_subscription_id'
  ) INTO v_has_new;

  IF v_has_old AND v_has_new THEN
    RAISE EXCEPTION
      'subscriptions has both kaspi_order_id and polar_subscription_id — manual cleanup required';
  END IF;

  IF v_has_old AND NOT v_has_new THEN
    ALTER TABLE public.subscriptions
      RENAME COLUMN kaspi_order_id TO polar_subscription_id;
  END IF;

  IF NOT v_has_old AND NOT v_has_new THEN
    RAISE EXCEPTION
      'subscriptions has neither kaspi_order_id nor polar_subscription_id — schema is broken';
  END IF;
END $$;

-- Idempotent: the unique index is required by webhook upserts
-- (onConflict: 'polar_subscription_id'). Partial index so rows with
-- NULL subscription id (legacy / manual) don't block each other.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_polar_subscription_id_unique_idx
  ON public.subscriptions(polar_subscription_id)
  WHERE polar_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.subscriptions.polar_subscription_id IS
  'Polar subscription ID (sub_xxx). Used as conflict target for webhook '
  'upserts so retries are idempotent. Renamed from kaspi_order_id in '
  'migration 022; this migration enforces the final state.';
