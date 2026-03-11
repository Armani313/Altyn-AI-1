/**
 * AI Generation Queue Manager
 *
 * - Accepts jobs from any AI provider
 * - Processes them with per-provider rate limiting and concurrency caps
 * - Retries transient errors (429, 503, timeout) with exponential backoff
 * - Exposes waitForJob() for synchronous callers (image generation)
 * - Async callers (video) get a job ID and poll /api/jobs/[id]
 */

import type { QueueJob, AIProvider, JobResult, EnqueueOptions, ProviderId } from './types'
import { jobStore } from './job-store'
import { RateLimiter } from './rate-limiter'

const TICK_INTERVAL_MS = 300  // how often the worker loop checks the queue

const rateLimiter = new RateLimiter()

// Transient error patterns — safe to retry
const TRANSIENT_PATTERNS = [
  '429', '503', '502', '504',
  'rate limit', 'quota', 'лимит запросов',
  'timeout', 'временно недоступен',
  'ECONNRESET', 'ETIMEDOUT',
]

function isTransient(message: string): boolean {
  const lower = message.toLowerCase()
  return TRANSIENT_PATTERNS.some((p) => lower.includes(p.toLowerCase()))
}

class QueueManager {
  private queue:    QueueJob[] = []
  private inFlight: Map<ProviderId, number> = new Map()
  private providers: Map<ProviderId, AIProvider> = new Map()
  private tickTimer: ReturnType<typeof setInterval> | null = null

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider)
    this.inFlight.set(provider.id, 0)
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  enqueue(opts: EnqueueOptions): QueueJob {
    const job: QueueJob = {
      id:          crypto.randomUUID(),
      userId:      opts.userId,
      providerId:  opts.providerId,
      type:        opts.type,
      priority:    opts.priority    ?? 0,
      status:      'queued',
      params:      opts.params,
      createdAt:   Date.now(),
      attempts:    0,
      maxAttempts: opts.maxAttempts ?? 3,
    }
    jobStore.set(job)
    this.push(job)
    this.ensureTick()
    return job
  }

  getJob(id: string): QueueJob | undefined {
    return jobStore.get(id)
  }

  /**
   * Wait for a job to reach `completed` or `failed`, up to `timeoutMs`.
   * Returns the final job state (caller checks `.status`).
   */
  async waitForJob(jobId: string, timeoutMs = 55_000): Promise<QueueJob> {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const job = jobStore.get(jobId)
      if (!job) throw new Error(`Job ${jobId} not found`)
      if (job.status === 'completed' || job.status === 'failed') return job
      await sleep(300)
    }
    return jobStore.get(jobId) ?? ({ status: 'queued' } as QueueJob)
  }

  // ── Queue internals ─────────────────────────────────────────────────────────

  private push(job: QueueJob): void {
    this.queue.push(job)
    // Sort descending by priority; equal priority = FIFO by createdAt
    this.queue.sort((a, b) =>
      b.priority !== a.priority
        ? b.priority - a.priority
        : a.createdAt - b.createdAt
    )
  }

  private ensureTick(): void {
    if (this.tickTimer) return
    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS)
    if (this.tickTimer.unref) this.tickTimer.unref()
  }

  private tick(): void {
    if (this.queue.length === 0) return

    for (let i = 0; i < this.queue.length; i++) {
      const job      = this.queue[i]
      const provider = this.providers.get(job.providerId)
      if (!provider) continue

      // Concurrency cap
      const current = this.inFlight.get(job.providerId) ?? 0
      if (current >= provider.config.maxConcurrent) continue

      // Retry delay not yet elapsed
      if (job._retryAfter && Date.now() < job._retryAfter) continue

      // Daily cap (RPD) — fail immediately, no retry
      if (provider.config.rpd !== undefined &&
          rateLimiter.dailyRemaining(job.providerId, provider.config.rpd) <= 0) {
        this.queue.splice(i, 1)
        i--
        const hoursLeft = Math.ceil(msUntilUtcMidnight() / 3_600_000)
        const errMsg = `Дневной лимит генераций исчерпан. Попробуйте через ~${hoursLeft} ч.`
        job.status      = 'failed'
        job.error       = errMsg
        job.completedAt = Date.now()
        jobStore.update(job.id, { status: 'failed', error: errMsg, completedAt: job.completedAt })
        console.warn(`[Queue] Job ${job.id} rejected: daily RPD limit reached`)
        continue
      }

      // Rate limit (RPM)
      if (!rateLimiter.consume(job.providerId, provider.config.rpm)) continue

      // Consume daily slot
      if (provider.config.rpd !== undefined) {
        rateLimiter.consumeDay(job.providerId, provider.config.rpd)
      }

      // Dispatch
      this.queue.splice(i, 1)
      i--
      this.inFlight.set(job.providerId, current + 1)
      this.run(job, provider).finally(() => {
        this.inFlight.set(job.providerId, (this.inFlight.get(job.providerId) ?? 1) - 1)
      })
    }
  }

  private async run(job: QueueJob, provider: AIProvider): Promise<void> {
    job.status    = 'processing'
    job.startedAt = Date.now()
    job.attempts += 1
    jobStore.update(job.id, {
      status:    'processing',
      startedAt: job.startedAt,
      attempts:  job.attempts,
    })

    try {
      const result: JobResult = await provider.execute(job.params)
      job.status      = 'completed'
      job.result      = result
      job.completedAt = Date.now()
      jobStore.update(job.id, {
        status:      'completed',
        result,
        completedAt: job.completedAt,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'

      if (isTransient(message) && job.attempts < job.maxAttempts) {
        const delays    = provider.config.retryDelays
        const delay     = delays[job.attempts - 1] ?? delays[delays.length - 1]
        job._retryAfter = Date.now() + delay
        job.status      = 'queued'
        jobStore.update(job.id, { status: 'queued' })
        this.push(job)
        console.warn(`[Queue] Job ${job.id} retry ${job.attempts}/${job.maxAttempts} in ${delay}ms`)
      } else {
        job.status      = 'failed'
        job.error       = message
        job.completedAt = Date.now()
        jobStore.update(job.id, {
          status:      'failed',
          error:       message,
          completedAt: job.completedAt,
        })
        console.error(`[Queue] Job ${job.id} failed permanently: ${message}`)
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function msUntilUtcMidnight(): number {
  const now  = Date.now()
  const next = new Date()
  next.setUTCHours(24, 0, 0, 0)
  return Math.max(0, next.getTime() - now)
}

// ── Singleton (survives hot reload in dev) ────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __queueManager: QueueManager | undefined
}

export const queueManager: QueueManager =
  globalThis.__queueManager ?? new QueueManager()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__queueManager = queueManager
}
