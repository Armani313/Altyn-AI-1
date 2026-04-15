-- ============================================================
-- Migration 020 — Credit audit log and refund-failure tracking
--
-- Goals (from subscription audit 2026-04-16):
--   MED-1: No audit log of credit movements — makes financial
--          reconciliation and fraud investigation impossible.
--          Introduce `credit_transactions` table recording every
--          delta against profiles.credits_remaining.
--
--   MED-2: `refundWithRetry` silently logs CRITICAL and gives up —
--          no durable record for admin follow-up. Introduce
--          `refund_failures` so admins can reconcile by hand.
--
-- Notes:
--   • History is forward-looking: we don't back-fill transactions
--     from generations/video_generations — those tables remain the
--     record of truth for the period before this migration.
--   • INSERTs restricted to service_role (client code can only SELECT
--     its own rows). Actual writes happen via credit RPCs introduced
--     in migration 021.
-- ============================================================

-- ── credit_transactions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  delta          integer     NOT NULL CHECK (delta <> 0),
  reason         text        NOT NULL CHECK (reason IN (
                   'signup_trial',
                   'generation',
                   'video',
                   'upscale',
                   'refund_generation',
                   'refund_video',
                   'refund_upscale',
                   'subscription_grant',
                   'subscription_downgrade',
                   'manual_adjustment'
                 )),
  ref_id         text,
  balance_after  integer     NOT NULL CHECK (balance_after >= 0),
  metadata       jsonb       NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reason
  ON public.credit_transactions (reason);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions (billing history UI).
DROP POLICY IF EXISTS "credit_transactions_select_own"
  ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_own"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Writes are service_role only — no INSERT/UPDATE/DELETE policy for other roles.
REVOKE INSERT, UPDATE, DELETE ON public.credit_transactions FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.credit_transactions FROM authenticated;
GRANT  INSERT, UPDATE, DELETE ON public.credit_transactions TO service_role;

COMMENT ON TABLE public.credit_transactions IS
  'Immutable audit log of every change to profiles.credits_remaining. '
  'Written by server-side RPCs (decrement_credits_by, refund_credits_by). '
  'History begins at migration 020 deploy — earlier balances are not back-filled.';

COMMENT ON COLUMN public.credit_transactions.delta IS
  'Signed credit delta. Negative = spend, positive = grant/refund.';

COMMENT ON COLUMN public.credit_transactions.ref_id IS
  'Opaque reference to the originating resource: '
  'generations.id / video_generations.id / Polar subscription id / null for manual_adjustment.';

-- ── refund_failures ──────────────────────────────────────────────────────────
-- Written when all three refund attempts exhaust. Visible to service_role only;
-- an admin should periodically check this table and reconcile balances by hand.

CREATE TABLE IF NOT EXISTS public.refund_failures (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount       integer     NOT NULL CHECK (amount > 0),
  reason       text        NOT NULL,
  ref_id       text,
  error        text,
  context      text,
  resolved_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refund_failures_unresolved
  ON public.refund_failures (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.refund_failures ENABLE ROW LEVEL SECURITY;

-- No policies => only service_role (which bypasses RLS) can read/write.
REVOKE ALL ON public.refund_failures FROM PUBLIC;
REVOKE ALL ON public.refund_failures FROM authenticated;
GRANT  ALL ON public.refund_failures TO service_role;

COMMENT ON TABLE public.refund_failures IS
  'Durable record of exhausted refund retries. '
  'Check regularly and reconcile balances manually. '
  'Set resolved_at once a manual credit adjustment has been made.';
