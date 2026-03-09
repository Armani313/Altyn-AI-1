-- ============================================================
-- Migration 006 — Security hardening round 2
--
-- Fixes:
--   MED-NEW-4: Credit race condition — adds refund_credit RPC
--              so the API can issue a credit back when AI fails
--              after a credit was already debited.
--   LOW-NEW-4: No DELETE policy for generated-images bucket —
--              users could not delete their own generated images
--              (GDPR / data ownership compliance).
-- ============================================================

-- ── refund_credit RPC ─────────────────────────────────────────────────────────
-- Called server-side (via service_role client) when AI generation fails
-- after decrement_credits already ran.  The trigger in 003_security.sql blocks
-- credits_remaining updates from non-service_role callers; calling this via
-- the service_role client means auth.role() = 'service_role', so the trigger
-- allows the update.

CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits_remaining = credits_remaining + 1
  WHERE id = p_user_id;
END;
$$;

-- Restrict execution to service_role only (called exclusively from server-side code)
REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.refund_credit(uuid) TO service_role;

COMMENT ON FUNCTION public.refund_credit IS
  'Refunds one credit to a user profile. '
  'Must be called via the service_role client. '
  'Used when AI generation fails after decrement_credits already ran.';

-- ── Storage: DELETE policy for generated-images ───────────────────────────────
-- LOW-NEW-4: Allow each user to delete only their own generated images.
-- Path format: {user_id}/{generation_id}-result.{ext}

CREATE POLICY "results_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
