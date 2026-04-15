-- ============================================================
-- Migration 021 — Credit RPCs with amount parameter + audit
--
-- Goals (from subscription audit 2026-04-16):
--   CRIT-VIDEO: decrement_credits always debits 1 credit even for
--               operations that cost more (video = 6 credits). This
--               replaces the fixed-amount RPC with a variant that
--               accepts an amount + reason + ref_id and writes to
--               credit_transactions for audit.
--
--   MED-1:      Every credit movement now produces a row in
--               credit_transactions via SECURITY DEFINER RPC.
--
-- Backward compatibility:
--   The legacy `decrement_credits(p_user_id)` and `refund_credit(p_user_id)`
--   functions are replaced with SQL wrappers that forward to the new
--   RPCs with amount=1 and reason='generation'/'refund_generation'.
--   Existing callers continue to work without code changes.
-- ============================================================

-- ── decrement_credits_by ─────────────────────────────────────────────────────
-- Atomically debits p_amount credits if sufficient balance exists.
-- Returns the new balance on success, or -1 if insufficient / invalid amount.
-- The check `credits_remaining >= p_amount` is inside the UPDATE, so the
-- decision is atomic and safe against concurrent requests.
CREATE OR REPLACE FUNCTION public.decrement_credits_by(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text,
  p_ref_id  text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE public.profiles
  SET    credits_remaining = credits_remaining - p_amount
  WHERE  id = p_user_id
    AND  credits_remaining >= p_amount
  RETURNING credits_remaining INTO v_remaining;

  IF v_remaining IS NULL THEN
    RETURN -1;
  END IF;

  INSERT INTO public.credit_transactions (
    user_id, delta, reason, ref_id, balance_after
  )
  VALUES (
    p_user_id, -p_amount, p_reason, p_ref_id, v_remaining
  );

  RETURN v_remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_credits_by(uuid, integer, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_credits_by(uuid, integer, text, text)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_credits_by(uuid, integer, text, text)
  TO service_role;

COMMENT ON FUNCTION public.decrement_credits_by IS
  'Atomically debit N credits from a profile and record the transaction. '
  'Returns new balance, or -1 if insufficient credits / invalid amount. '
  'Must be called via service_role. Reason values are validated by the '
  'credit_transactions.reason CHECK constraint.';

-- ── refund_credits_by ────────────────────────────────────────────────────────
-- Adds p_amount credits and writes the audit row. Always succeeds for
-- amount > 0 (no upper bound — caller is trusted service_role).
CREATE OR REPLACE FUNCTION public.refund_credits_by(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text,
  p_ref_id  text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE public.profiles
  SET    credits_remaining = credits_remaining + p_amount
  WHERE  id = p_user_id
  RETURNING credits_remaining INTO v_remaining;

  IF v_remaining IS NULL THEN
    -- Profile not found — nothing we can refund.
    RETURN -1;
  END IF;

  INSERT INTO public.credit_transactions (
    user_id, delta, reason, ref_id, balance_after
  )
  VALUES (
    p_user_id, p_amount, p_reason, p_ref_id, v_remaining
  );

  RETURN v_remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits_by(uuid, integer, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credits_by(uuid, integer, text, text)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits_by(uuid, integer, text, text)
  TO service_role;

COMMENT ON FUNCTION public.refund_credits_by IS
  'Credit N tokens back to a profile and record the transaction. '
  'Returns new balance or -1 on invalid input / missing profile.';

-- ── set_subscription_credits ─────────────────────────────────────────────────
-- Used by the Polar webhook when activating or renewing a subscription.
-- POLICY: monthly credits RESET to plan quota (not accumulate) — confirmed
-- with product owner (2026-04-16). This function therefore OVERWRITES the
-- balance and records the delta (may be positive or negative).
CREATE OR REPLACE FUNCTION public.set_subscription_credits(
  p_user_id uuid,
  p_plan    text,
  p_credits integer,
  p_reason  text,
  p_ref_id  text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_credits integer;
  v_delta       integer;
BEGIN
  IF p_credits IS NULL OR p_credits < 0 THEN
    RETURN -1;
  END IF;

  IF p_reason NOT IN ('subscription_grant', 'subscription_downgrade') THEN
    RAISE EXCEPTION 'set_subscription_credits: invalid reason "%"', p_reason;
  END IF;

  SELECT credits_remaining INTO v_old_credits
  FROM   public.profiles
  WHERE  id = p_user_id
  FOR    UPDATE;

  IF v_old_credits IS NULL THEN
    RETURN -1;
  END IF;

  UPDATE public.profiles
  SET    plan              = p_plan,
         credits_remaining = p_credits
  WHERE  id = p_user_id;

  v_delta := p_credits - v_old_credits;

  -- Only record a transaction if there is an actual delta, since
  -- credit_transactions.delta CHECK (delta <> 0) rejects zero rows.
  IF v_delta <> 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, delta, reason, ref_id, balance_after, metadata
    )
    VALUES (
      p_user_id,
      v_delta,
      p_reason,
      p_ref_id,
      p_credits,
      jsonb_build_object(
        'plan',            p_plan,
        'previous_credits', v_old_credits
      )
    );
  END IF;

  RETURN p_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.set_subscription_credits(uuid, text, integer, text, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_subscription_credits(uuid, text, integer, text, text)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_subscription_credits(uuid, text, integer, text, text)
  TO service_role;

COMMENT ON FUNCTION public.set_subscription_credits IS
  'Atomically set plan and credits_remaining (monthly reset policy) and '
  'record the net delta in credit_transactions. Used by Polar webhook on '
  'subscription activation / renewal / downgrade.';

-- ── Backward-compatible wrappers ─────────────────────────────────────────────
-- Route code that still calls decrement_credits / refund_credit keeps working
-- and transparently produces audit rows with reason='generation' /
-- 'refund_generation' and no ref_id. New code should call the *_by variants
-- directly to pass a correct reason + ref_id.
CREATE OR REPLACE FUNCTION public.decrement_credits(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.decrement_credits_by(p_user_id, 1, 'generation', NULL);
$$;

CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refund_credits_by(p_user_id, 1, 'refund_generation', NULL);
END;
$$;

-- GRANTs on the legacy function names were set by previous migrations
-- (migration 001 for decrement_credits, 006 for refund_credit). They persist
-- across CREATE OR REPLACE, so no regrant is needed.

COMMENT ON FUNCTION public.decrement_credits IS
  'Legacy wrapper (keeps existing callers working). Forwards to '
  'decrement_credits_by(user, 1, ''generation'', NULL). Prefer the new '
  'RPC in new code so reason and ref_id are accurate.';

COMMENT ON FUNCTION public.refund_credit IS
  'Legacy wrapper. Forwards to refund_credits_by(user, 1, ''refund_generation'', NULL).';
