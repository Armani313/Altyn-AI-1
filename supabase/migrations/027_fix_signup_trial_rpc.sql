-- Emergency signup-trial hotfix:
-- 1. New users receive their 3 starter credits directly in handle_new_user().
-- 2. claim_signup_trial() becomes a simple reconciler for pending profiles.
-- 3. Existing pending profiles are backfilled in-place.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $handle_new_user$
BEGIN
  INSERT INTO public.profiles (
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
    3,
    'granted',
    now(),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_transactions (
    user_id,
    delta,
    reason,
    ref_id,
    balance_after,
    metadata
  )
  SELECT
    NEW.id,
    3,
    'signup_trial',
    NULL,
    3,
    jsonb_build_object('source', 'handle_new_user_hotfix')
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.credit_transactions AS ct
    WHERE ct.user_id = NEW.id
      AND ct.reason = 'signup_trial'
  );

  RETURN NEW;
END;
$handle_new_user$;

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
AS $claim_signup_trial$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = p_user_id
  ) THEN
    RETURN QUERY
    SELECT false, 'blocked'::text, NULL::integer, 'profile_missing'::text;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = p_user_id
      AND p.trial_credits_decision = 'blocked'
  ) THEN
    RETURN QUERY
    SELECT
      false,
      'blocked'::text,
      p.credits_remaining,
      COALESCE(p.trial_credits_block_reason, 'blocked')::text
    FROM public.profiles AS p
    WHERE p.id = p_user_id;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = p_user_id
      AND (
        p.trial_credits_decision IN ('granted', 'legacy')
        OR p.trial_credits_granted_at IS NOT NULL
      )
  ) THEN
    RETURN QUERY
    SELECT
      true,
      COALESCE(p.trial_credits_decision, 'granted')::text,
      p.credits_remaining,
      COALESCE(p.trial_credits_block_reason, 'already_granted')::text
    FROM public.profiles AS p
    WHERE p.id = p_user_id;
    RETURN;
  END IF;

  UPDATE public.profiles AS p
  SET
    credits_remaining = CASE
      WHEN p.credits_remaining = 0 THEN p.credits_remaining + 3
      ELSE p.credits_remaining
    END,
    trial_credits_decision = 'granted',
    trial_credits_granted_at = COALESCE(p.trial_credits_granted_at, now()),
    trial_credits_block_reason = NULL
  WHERE p.id = p_user_id
    AND p.trial_credits_decision = 'pending';

  INSERT INTO public.credit_transactions (
    user_id,
    delta,
    reason,
    ref_id,
    balance_after,
    metadata
  )
  SELECT
    p.id,
    3,
    'signup_trial',
    NULL,
    p.credits_remaining,
    jsonb_build_object('source', 'claim_signup_trial_hotfix')
  FROM public.profiles AS p
  WHERE p.id = p_user_id
    AND p.trial_credits_decision = 'granted'
    AND p.credits_remaining = 3
    AND NOT EXISTS (
      SELECT 1
      FROM public.credit_transactions AS ct
      WHERE ct.user_id = p.id
        AND ct.reason = 'signup_trial'
    );

  RETURN QUERY
  SELECT
    (p.trial_credits_decision IN ('granted', 'legacy') OR p.trial_credits_granted_at IS NOT NULL),
    COALESCE(p.trial_credits_decision, 'pending')::text,
    p.credits_remaining,
    CASE
      WHEN p.trial_credits_decision = 'blocked' THEN COALESCE(p.trial_credits_block_reason, 'blocked')
      WHEN p.trial_credits_decision IN ('granted', 'legacy') OR p.trial_credits_granted_at IS NOT NULL THEN 'trial_granted'
      ELSE NULL
    END::text
  FROM public.profiles AS p
  WHERE p.id = p_user_id;
END;
$claim_signup_trial$;

WITH credited AS (
  UPDATE public.profiles AS p
  SET
    credits_remaining = p.credits_remaining + 3,
    trial_credits_decision = 'granted',
    trial_credits_granted_at = COALESCE(p.trial_credits_granted_at, now()),
    trial_credits_block_reason = NULL
  WHERE p.trial_credits_decision = 'pending'
    AND p.credits_remaining = 0
  RETURNING p.id, p.credits_remaining
)
INSERT INTO public.credit_transactions (
  user_id,
  delta,
  reason,
  ref_id,
  balance_after,
  metadata
)
SELECT
  c.id,
  3,
  'signup_trial',
  NULL,
  c.credits_remaining,
  jsonb_build_object('source', 'pending_backfill_hotfix')
FROM credited AS c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.credit_transactions AS ct
  WHERE ct.user_id = c.id
    AND ct.reason = 'signup_trial'
);

UPDATE public.profiles AS p
SET
  trial_credits_decision = 'granted',
  trial_credits_granted_at = COALESCE(p.trial_credits_granted_at, now()),
  trial_credits_block_reason = NULL
WHERE p.trial_credits_decision = 'pending'
  AND p.credits_remaining > 0;

REVOKE ALL ON FUNCTION public.claim_signup_trial(uuid, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_signup_trial(uuid, text, text, text, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.claim_signup_trial(uuid, text, text, text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_signup_trial(uuid, text, text, text, text, text, text) TO service_role;
