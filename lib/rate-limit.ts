/**
 * In-memory per-user / per-IP rate limiter.
 *
 * NOTE: Works correctly for single-instance deployments.
 * For horizontal scaling (multiple containers) replace with Redis/Upstash.
 */

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
export function checkRateLimit(
  route:    string,
  key:      string,
  limit:    number,
  windowMs: number,
): { ok: boolean; retryAfterSec?: number } {
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
