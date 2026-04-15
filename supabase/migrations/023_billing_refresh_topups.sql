-- Refresh billing quotas and add one-time top-up credit grants.

-- ── Bootstrap prerequisites for databases that skipped earlier billing auth
--    migrations (019 / 020). This keeps the migration idempotent when it is
--    applied manually on an environment with partial schema history.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_credits_decision text NOT NULL DEFAULT 'legacy'
  CHECK (trial_credits_decision IN ('pending', 'granted', 'blocked', 'legacy')),
ADD COLUMN IF NOT EXISTS trial_credits_granted_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_credits_block_reason text;

CREATE TABLE IF NOT EXISTS public.trial_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  email_normalized text,
  email_domain text,
  device_hash text,
  ip_hash text,
  subnet_hash text,
  ua_hash text,
  risk_score integer NOT NULL DEFAULT 0 CHECK (risk_score >= 0),
  decision text NOT NULL CHECK (decision IN ('granted', 'blocked')),
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_claims_email_normalized
  ON public.trial_claims (email_normalized);

CREATE INDEX IF NOT EXISTS idx_trial_claims_device_hash
  ON public.trial_claims (device_hash);

CREATE INDEX IF NOT EXISTS idx_trial_claims_ip_hash_created_at
  ON public.trial_claims (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trial_claims_subnet_hash_created_at
  ON public.trial_claims (subnet_hash, created_at DESC);

ALTER TABLE public.trial_claims ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.trial_claims FROM PUBLIC;
REVOKE ALL ON public.trial_claims FROM anon;
REVOKE ALL ON public.trial_claims FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.trial_claims TO service_role;

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
                   'topup_purchase',
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

DROP POLICY IF EXISTS "credit_transactions_select_own"
  ON public.credit_transactions;
CREATE POLICY "credit_transactions_select_own"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.credit_transactions FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.credit_transactions FROM authenticated;
GRANT INSERT, UPDATE, DELETE ON public.credit_transactions TO service_role;

-- ── Free plan defaults ───────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ALTER COLUMN credits_remaining SET DEFAULT 0;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (
    id,
    business_name,
    contact_name,
    phone,
    avatar_url,
    email,
    credits_remaining,
    trial_credits_decision,
    trial_credits_granted_at,
    trial_credits_block_reason
  )
  VALUES (
    NEW.id,
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'business_name', ''), ''),
    NULLIF(
      COALESCE(
        NEW.raw_user_meta_data->>'contact_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(COALESCE(NEW.email, ''), '@', 1)
      ),
      ''
    ),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), ''),
    NEW.email,
    0,
    'pending',
    NULL,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_signup_trial(
  p_user_id uuid,
  p_email_normalized text,
  p_email_domain text,
  p_device_hash text,
  p_ip_hash text,
  p_subnet_hash text,
  p_ua_hash text
)
RETURNS TABLE(granted boolean, decision text, credits_remaining integer, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_existing public.trial_claims%ROWTYPE;
  v_email_grants integer := 0;
  v_device_grants integer := 0;
  v_ip_recent integer := 0;
  v_subnet_recent integer := 0;
  v_ua_subnet_recent integer := 0;
  v_risk_score integer := 0;
  v_reason text := NULL;
  v_credits integer := NULL;
  v_disposable boolean := false;
  v_disposable_domains text[] := ARRAY[
    'mailinator.com',
    'guerrillamail.com',
    '10minutemail.com',
    'tempmail.com',
    'trashmail.com',
    'yopmail.com',
    'sharklasers.com',
    'getnada.com',
    'maildrop.cc',
    'temp-mail.org'
  ];
BEGIN
  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'blocked'::text, NULL::integer, 'profile_missing'::text;
    RETURN;
  END IF;

  IF v_profile.trial_credits_decision IN ('granted', 'legacy')
     OR v_profile.trial_credits_granted_at IS NOT NULL THEN
    RETURN QUERY
    SELECT
      true,
      COALESCE(v_profile.trial_credits_decision, 'granted')::text,
      v_profile.credits_remaining,
      COALESCE(v_profile.trial_credits_block_reason, 'already_granted')::text;
    RETURN;
  END IF;

  IF v_profile.trial_credits_decision = 'blocked' THEN
    RETURN QUERY
    SELECT false, 'blocked'::text, v_profile.credits_remaining, COALESCE(v_profile.trial_credits_block_reason, 'blocked')::text;
    RETURN;
  END IF;

  SELECT *
  INTO v_existing
  FROM public.trial_claims
  WHERE user_id = p_user_id;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      (v_existing.decision = 'granted'),
      v_existing.decision,
      v_profile.credits_remaining,
      COALESCE(v_existing.reason, 'already_evaluated');
    RETURN;
  END IF;

  IF p_email_domain IS NOT NULL THEN
    v_disposable := lower(p_email_domain) = ANY(v_disposable_domains);
  END IF;

  IF p_email_normalized IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_email_grants
    FROM public.trial_claims
    WHERE email_normalized = p_email_normalized
      AND decision = 'granted';
  END IF;

  IF p_device_hash IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_device_grants
    FROM public.trial_claims
    WHERE device_hash = p_device_hash
      AND decision = 'granted';
  END IF;

  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_ip_recent
    FROM public.trial_claims
    WHERE ip_hash = p_ip_hash
      AND created_at > now() - interval '24 hours';
  END IF;

  IF p_subnet_hash IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_subnet_recent
    FROM public.trial_claims
    WHERE subnet_hash = p_subnet_hash
      AND created_at > now() - interval '24 hours';
  END IF;

  IF p_subnet_hash IS NOT NULL AND p_ua_hash IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_ua_subnet_recent
    FROM public.trial_claims
    WHERE subnet_hash = p_subnet_hash
      AND ua_hash = p_ua_hash
      AND created_at > now() - interval '1 hour';
  END IF;

  IF v_email_grants > 0 THEN
    v_risk_score := v_risk_score + 100;
    v_reason := 'email_reuse';
  END IF;

  IF v_device_grants > 0 THEN
    v_risk_score := v_risk_score + 100;
    v_reason := COALESCE(v_reason, 'device_reuse');
  END IF;

  IF v_disposable THEN
    v_risk_score := v_risk_score + 40;
    v_reason := COALESCE(v_reason, 'disposable_email');
  END IF;

  IF v_ip_recent >= 2 THEN
    v_risk_score := v_risk_score + 30;
    v_reason := COALESCE(v_reason, 'ip_cluster');
  END IF;

  IF v_subnet_recent >= 4 THEN
    v_risk_score := v_risk_score + 20;
    v_reason := COALESCE(v_reason, 'subnet_cluster');
  END IF;

  IF v_ua_subnet_recent >= 3 THEN
    v_risk_score := v_risk_score + 20;
    v_reason := COALESCE(v_reason, 'ua_subnet_cluster');
  END IF;

  IF v_risk_score >= 60 THEN
    INSERT INTO public.trial_claims (
      user_id,
      email_normalized,
      email_domain,
      device_hash,
      ip_hash,
      subnet_hash,
      ua_hash,
      risk_score,
      decision,
      reason,
      metadata
    )
    VALUES (
      p_user_id,
      p_email_normalized,
      p_email_domain,
      p_device_hash,
      p_ip_hash,
      p_subnet_hash,
      p_ua_hash,
      v_risk_score,
      'blocked',
      COALESCE(v_reason, 'risk_blocked'),
      jsonb_build_object(
        'email_grants', v_email_grants,
        'device_grants', v_device_grants,
        'ip_recent', v_ip_recent,
        'subnet_recent', v_subnet_recent,
        'ua_subnet_recent', v_ua_subnet_recent,
        'disposable', v_disposable
      )
    );

    UPDATE public.profiles
    SET
      trial_credits_decision = 'blocked',
      trial_credits_block_reason = COALESCE(v_reason, 'risk_blocked')
    WHERE id = p_user_id;

    RETURN QUERY
    SELECT false, 'blocked'::text, v_profile.credits_remaining, COALESCE(v_reason, 'risk_blocked')::text;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    credits_remaining = credits_remaining + 3,
    trial_credits_decision = 'granted',
    trial_credits_granted_at = now(),
    trial_credits_block_reason = NULL
  WHERE id = p_user_id
  RETURNING profiles.credits_remaining INTO v_credits;

  INSERT INTO public.trial_claims (
    user_id,
    email_normalized,
    email_domain,
    device_hash,
    ip_hash,
    subnet_hash,
    ua_hash,
    risk_score,
    decision,
    reason,
    metadata
  )
  VALUES (
    p_user_id,
    p_email_normalized,
    p_email_domain,
    p_device_hash,
    p_ip_hash,
    p_subnet_hash,
    p_ua_hash,
    v_risk_score,
    'granted',
    'trial_granted',
    jsonb_build_object(
      'email_grants', v_email_grants,
      'device_grants', v_device_grants,
      'ip_recent', v_ip_recent,
      'subnet_recent', v_subnet_recent,
      'ua_subnet_recent', v_ua_subnet_recent,
      'disposable', v_disposable
    )
  );

  INSERT INTO public.credit_transactions (
    user_id,
    delta,
    reason,
    ref_id,
    balance_after,
    metadata
  )
  VALUES (
    p_user_id,
    3,
    'signup_trial',
    NULL,
    v_credits,
    jsonb_build_object(
      'email_grants', v_email_grants,
      'device_grants', v_device_grants,
      'ip_recent', v_ip_recent,
      'subnet_recent', v_subnet_recent,
      'ua_subnet_recent', v_ua_subnet_recent,
      'disposable', v_disposable
    )
  );

  RETURN QUERY SELECT true, 'granted'::text, v_credits, 'trial_granted'::text;
END;
$$;

-- ── credit_transactions reason expansion ─────────────────────────────────────

ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_reason_check;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_reason_check
  CHECK (reason IN (
    'signup_trial',
    'generation',
    'video',
    'upscale',
    'refund_generation',
    'refund_video',
    'refund_upscale',
    'subscription_grant',
    'subscription_downgrade',
    'topup_purchase',
    'manual_adjustment'
  ));

-- ── grant_topup_credits ──────────────────────────────────────────────────────
-- Idempotent for repeated webhook deliveries with the same ref_id. We lock the
-- profile row first, then look for an existing top-up transaction for that
-- order so concurrent retries cannot double-grant credits.

CREATE OR REPLACE FUNCTION public.grant_topup_credits(
  p_user_id uuid,
  p_amount integer,
  p_ref_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_credits integer;
  v_new_balance integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN -1;
  END IF;

  SELECT credits_remaining
  INTO v_old_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_old_credits IS NULL THEN
    RETURN -1;
  END IF;

  IF p_ref_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND reason = 'topup_purchase'
      AND ref_id = p_ref_id
  ) THEN
    RETURN v_old_credits;
  END IF;

  UPDATE public.profiles
  SET credits_remaining = credits_remaining + p_amount
  WHERE id = p_user_id
  RETURNING credits_remaining INTO v_new_balance;

  INSERT INTO public.credit_transactions (
    user_id,
    delta,
    reason,
    ref_id,
    balance_after,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount,
    'topup_purchase',
    p_ref_id,
    v_new_balance,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'credits_added', p_amount,
      'previous_credits', v_old_credits
    )
  );

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_topup_credits(uuid, integer, text, jsonb)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_topup_credits(uuid, integer, text, jsonb)
  FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_topup_credits(uuid, integer, text, jsonb)
  TO service_role;

COMMENT ON FUNCTION public.grant_topup_credits IS
  'Adds purchased credits to a profile exactly once per ref_id and records the '
  'grant in credit_transactions with reason=''topup_purchase''.';
