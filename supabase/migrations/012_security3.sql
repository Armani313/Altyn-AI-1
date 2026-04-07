-- ============================================================
-- Migration 012 — Security hardening round 3
--
-- Fixes:
--   1. Shared server-side rate limiting via Postgres.
-- ============================================================

-- ── Shared rate limit storage ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  route text NOT NULL,
  key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT clock_timestamp(),
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (route, key)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.rate_limits FROM PUBLIC;
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.rate_limits FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_route text,
  p_key text,
  p_limit integer,
  p_window_ms integer
)
RETURNS TABLE(ok boolean, retry_after_sec integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  now_ts timestamptz := clock_timestamp();
  window_interval interval := ((p_window_ms)::text || ' milliseconds')::interval;
  current_count integer;
  current_window timestamptz;
BEGIN
  LOOP
    UPDATE public.rate_limits
    SET
      count = CASE
        WHEN window_start + window_interval <= now_ts THEN 1
        ELSE count + 1
      END,
      window_start = CASE
        WHEN window_start + window_interval <= now_ts THEN now_ts
        ELSE window_start
      END
    WHERE route = p_route AND key = p_key
    RETURNING count, window_start INTO current_count, current_window;

    IF FOUND THEN
      EXIT;
    END IF;

    BEGIN
      INSERT INTO public.rate_limits (route, key, window_start, count)
      VALUES (p_route, p_key, now_ts, 1);
      current_count := 1;
      current_window := now_ts;
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        -- Another request inserted the row first; retry the update branch.
    END;
  END LOOP;

  IF current_count > p_limit THEN
    RETURN QUERY
    SELECT
      false,
      GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM ((current_window + window_interval) - now_ts)))::integer
      );
    RETURN;
  END IF;

  RETURN QUERY SELECT true, NULL::integer;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO service_role;
