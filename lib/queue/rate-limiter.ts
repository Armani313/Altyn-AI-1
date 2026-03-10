/**
 * Token bucket rate limiter — one bucket per provider.
 * Bucket capacity = rpm. Refills at rpm/60 tokens per second.
 */
export class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>()

  consume(providerId: string, rpm: number): boolean {
    const now = Date.now()
    let bucket = this.buckets.get(providerId)

    if (!bucket) {
      // New provider: start with full bucket
      bucket = { tokens: rpm, lastRefill: now }
      this.buckets.set(providerId, bucket)
    }

    // Refill tokens based on elapsed time
    const elapsed   = (now - bucket.lastRefill) / 1000
    bucket.tokens   = Math.min(rpm, bucket.tokens + elapsed * (rpm / 60))
    bucket.lastRefill = now

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return true
    }
    return false
  }

  /** Peek: ms until a token is available for this provider */
  msUntilAvailable(providerId: string, rpm: number): number {
    const bucket = this.buckets.get(providerId)
    if (!bucket || bucket.tokens >= 1) return 0
    const deficit = 1 - bucket.tokens
    return Math.ceil(deficit * (60_000 / rpm))
  }
}
