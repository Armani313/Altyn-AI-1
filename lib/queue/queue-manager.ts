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
import { sleep } from '@/lib/utils'
import { createServiceClient } from '@/lib/supabase/service'

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

  /**
   * Called once on singleton creation.
   * 1. Seeds RPD counter from today's generation count in Supabase — prevents
   *    over-quota after a restart (in-memory counter was at 0).
   * 2. Marks stuck "processing" generations (older than 5 min) as failed —
   *    prevents records stuck in limbo after a mid-request deploy.
   *    Credits are refunded via refund_credits_by RPC for each stuck generation
   *    (audit-logged in credit_transactions with reason=refund_generation).
   *    Tiny double-refund risk (window between generation insert and credit
   *    decrement, ~ms) is accepted as preferable to silently eating user credits.
   */
  async init(): Promise<void> {
    try {
      const supabase  = createServiceClient()
      const todayUtc  = new Date()
      todayUtc.setUTCHours(0, 0, 0, 0)

      // 1. Seed RPD counter
      const { count: todayCount } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayUtc.toISOString())

      rateLimiter.seedDailyCount('gemini', todayCount ?? 0)
      console.log(`[Queue] init: seeded Gemini RPD = ${todayCount ?? 0} generations today`)

      // 2. Recover stuck processing generations + refund credits
      // Credit is decremented (step 7 in route.ts) before the AI call, so any
      // generation that's still "processing" after a restart had its credit taken.
      // We refund it here. The tiny window between DB insert and credit decrement
      // makes double-refund practically impossible.
      const stuckCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: stuck } = await supabase
        .from('generations')
        .update({ status: 'failed', error_message: 'Задание прервано при перезапуске сервера' } as never)
        .eq('status', 'processing')
        .lt('created_at', stuckCutoff)
        .select('id, user_id')

      if (stuck?.length) {
        console.log(`[Queue] init: recovering ${stuck.length} stuck generation(s), refunding credits`)
        // LOGIC-3: check each refund result individually so silent failures are logged.
        // Migration 021: use refund_credits_by with explicit reason+ref_id so each
        // stuck-generation refund produces an audit row linked to its generation id.
        const rows = stuck as { id: string; user_id: string }[]
        const refundResults = await Promise.allSettled(
          rows.map((g) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase as any).rpc('refund_credits_by', {
              p_user_id: g.user_id,
              p_amount: 1,
              p_reason: 'refund_generation',
              p_ref_id: g.id,
            })
          )
        )
        refundResults.forEach((r, i) => {
          const g = rows[i]
          if (r.status === 'rejected') {
            console.error(`[Queue] refund failed for user ${g.user_id} gen ${g.id}:`, r.reason)
          } else if ((r.value as { error?: unknown })?.error) {
            console.error(`[Queue] refund RPC error for user ${g.user_id} gen ${g.id}:`, (r.value as { error?: unknown }).error)
          }
        })
      }
    } catch (err) {
      // Non-fatal — queue still works, RPD just starts from 0
      console.error('[Queue] init() failed:', err)
    }
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
      meta:        opts.meta,
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

function msUntilUtcMidnight(): number {
  const now  = Date.now()
  // CRITICAL-3: setUTCHours(24) works "by accident" via JS rollover.
  // Use explicit next-day calculation instead.
  const next = new Date(now)
  next.setUTCDate(next.getUTCDate() + 1)
  next.setUTCHours(0, 0, 0, 0)
  return Math.max(0, next.getTime() - now)
}

// ── Singleton (survives hot reload in dev) ────────────────────────────────────

declare global {
  var __queueManager: QueueManager | undefined
}

export const queueManager: QueueManager =
  globalThis.__queueManager ?? new QueueManager()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__queueManager = queueManager
}
