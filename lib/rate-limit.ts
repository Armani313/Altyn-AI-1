/**
 * In-memory per-user / per-IP rate limiter.
 *
 * Prefers the shared Postgres-backed limiter via service_role RPC.
 * Falls back to in-memory counters only if the RPC or DB is unavailable.
 */

import { createServiceClient } from '@/lib/supabase/service'

interface Entry { count: number; windowStart: number }

// Separate stores per route to avoid cross-contamination of limits
const stores: Record<string, Map<string, Entry>> = {}

function getStore(route: string): Map<string, Entry> {
  if (!stores[route]) stores[route] = new Map()
  return stores[route]
}

/**
 * Checks (and increments) the rate-limit counter for `key` in `route`.
 *
 * @param route    Logical route name — keeps counters isolated per endpoint.
 * @param key      Usually `user.id` or an IP address.
 * @param limit    Max allowed calls within the window.
 * @param windowMs Window duration in milliseconds.
 */
export async function checkRateLimit(
  route:    string,
  key:      string,
  limit:    number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec?: number }> {
  try {
    const supabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('check_rate_limit', {
      p_route: route,
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs,
    })

    const row = Array.isArray(data) ? data[0] : data
    if (!error && row && typeof row.ok === 'boolean') {
      return row.ok
        ? { ok: true }
        : { ok: false, retryAfterSec: row.retry_after_sec ?? 1 }
    }

    if (error) {
      console.warn(`[RateLimit] shared limiter failed for route=${route}:`, error)
    }
  } catch (error) {
    console.warn(`[RateLimit] shared limiter unavailable for route=${route}:`, error)
  }

  const store = getStore(route)
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    // Prune stale entries periodically to prevent memory growth
    if (store.size > 20_000) {
      store.forEach((v, k) => { if (now - v.windowStart >= windowMs) store.delete(k) })
    }
    return { ok: true }
  }

  if (entry.count >= limit) {
    const retryAfterSec = Math.ceil((windowMs - (now - entry.windowStart)) / 1000)
    return { ok: false, retryAfterSec }
  }

  entry.count++
  return { ok: true }
}
