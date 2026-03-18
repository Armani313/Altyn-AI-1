/**
 * Rate limiter for AI providers.
 *
 * RPM — token bucket: capacity = rpm, refills at rpm/60 tokens per second.
 * RPD — daily counter: resets at UTC midnight, fails immediately when exhausted.
 */
export class RateLimiter {
  private buckets      = new Map<string, { tokens: number; lastRefill: number }>()
  private dailyBuckets = new Map<string, { count: number; dayStart: number }>()

  // ── RPM ──────────────────────────────────────────────────────────────────────

  consume(providerId: string, rpm: number): boolean {
    const now = Date.now()
    let bucket = this.buckets.get(providerId)

    if (!bucket) {
      bucket = { tokens: rpm, lastRefill: now }
      this.buckets.set(providerId, bucket)
    }

    const elapsed     = (now - bucket.lastRefill) / 1000
    bucket.tokens     = Math.min(rpm, bucket.tokens + elapsed * (rpm / 60))
    bucket.lastRefill = now

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return true
    }
    return false
  }

  /** ms until a token is available (for logging / debug) */
  msUntilAvailable(providerId: string, rpm: number): number {
    const bucket = this.buckets.get(providerId)
    if (!bucket || bucket.tokens >= 1) return 0
    const deficit = 1 - bucket.tokens
    return Math.ceil(deficit * (60_000 / rpm))
  }

  // ── RPD ──────────────────────────────────────────────────────────────────────

  /** How many requests remain today for this provider. */
  dailyRemaining(providerId: string, rpd: number): number {
    const counter = this.getDailyCounter(providerId)
    return Math.max(0, rpd - counter.count)
  }

  /**
   * Consume one daily request slot.
   * Returns false (and does NOT decrement) when the daily cap is already reached.
   */
  consumeDay(providerId: string, rpd: number): boolean {
    const counter = this.getDailyCounter(providerId)
    if (counter.count >= rpd) return false
    counter.count++
    return true
  }

  /**
   * Seed the daily counter with a known count (e.g. from DB on startup).
   * Only applied if the stored day matches today — stale seeds are ignored.
   */
  seedDailyCount(providerId: string, count: number): void {
    const today = utcDayStart()
    const existing = this.dailyBuckets.get(providerId)
    // Only seed if today's counter doesn't exist yet or is still zero
    if (!existing || existing.dayStart !== today || existing.count === 0) {
      this.dailyBuckets.set(providerId, { count, dayStart: today })
    }
  }

  /** Get (or reset) the daily counter for today, shared by dailyRemaining and consumeDay. */
  private getDailyCounter(providerId: string): { count: number; dayStart: number } {
    const today = utcDayStart()
    let counter = this.dailyBuckets.get(providerId)
    if (!counter || counter.dayStart !== today) {
      counter = { count: 0, dayStart: today }
      this.dailyBuckets.set(providerId, counter)
    }
    return counter
  }
}

/** Timestamp of today's 00:00:00 UTC in ms. */
function utcDayStart(): number {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}
