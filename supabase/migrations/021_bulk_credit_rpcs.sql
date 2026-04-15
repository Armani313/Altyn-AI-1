-- Add bulk credit debit/refund RPCs for variable-cost video generation.

CREATE OR REPLACE FUNCTION public.decrement_credits_by(p_user_id uuid, p_amount integer)
RETURNS integer LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_remaining integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE profiles
  SET credits_remaining = credits_remaining - p_amount
  WHERE id = p_user_id
    AND credits_remaining >= p_amount
  RETURNING credits_remaining INTO v_remaining;

  RETURN COALESCE(v_remaining, -1);
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_credits_by(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_credits_by(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_credits_by(uuid, integer) TO service_role;

COMMENT ON FUNCTION public.decrement_credits_by IS
  'Atomically decrements multiple credits from a user profile and returns the remaining balance, or -1 if insufficient.';

CREATE OR REPLACE FUNCTION public.refund_credits(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  UPDATE profiles
  SET credits_remaining = credits_remaining + p_amount
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credits(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, integer) TO service_role;

COMMENT ON FUNCTION public.refund_credits IS
  'Refunds multiple credits to a user profile. Used for variable-cost video generations.';
