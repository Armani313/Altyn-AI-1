-- ============================================================
-- Migration 003 — Security hardening
--
-- Fixes:
--   MED-4: Profiles RLS UPDATE policy allows users to
--          self-escalate `plan` and `credits_remaining`
--          via direct Supabase client calls (anon key is
--          publicly known by design).
--
-- Solution:
--   A BEFORE UPDATE trigger resets `plan` and
--   `credits_remaining` to their OLD values whenever the
--   caller is NOT the service_role. The service_role is
--   used exclusively by server-side API routes (via
--   createServiceClient) for legitimate mutations such as
--   subscription activation and credit deductions.
-- ============================================================

-- ── Trigger function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION profiles_prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs as the function owner, not the calling role
SET search_path = public  -- prevent search_path hijacking
AS $$
BEGIN
  -- auth.role() returns 'service_role' when called via the service key,
  -- 'authenticated' for normal user JWT calls.
  -- Only service_role is allowed to change plan or credits_remaining.
  IF auth.role() <> 'service_role' THEN
    NEW.plan               := OLD.plan;
    NEW.credits_remaining  := OLD.credits_remaining;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Attach to profiles ────────────────────────────────────────────────────────

-- Drop first in case of re-run
DROP TRIGGER IF EXISTS trg_profiles_prevent_privilege_escalation ON profiles;

CREATE TRIGGER trg_profiles_prevent_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_prevent_privilege_escalation();

-- ── Comment ───────────────────────────────────────────────────────────────────

COMMENT ON FUNCTION profiles_prevent_privilege_escalation IS
  'Prevents authenticated users from self-escalating plan or credits via direct RLS UPDATE. '
  'Only service_role (used by server-side API routes) may change these fields.';
