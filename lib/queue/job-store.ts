import type { QueueJob } from './types'

const JOB_TTL_MS      = 60 * 60 * 1000  // 1 hour after completion
const CLEANUP_INTERVAL = 15 * 60 * 1000  // run cleanup every 15 min

class JobStore {
  private store = new Map<string, QueueJob>()

  constructor() {
    // Cleanup stale jobs periodically
    const timer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL)
    // Allow process to exit cleanly even if interval is active
    if (timer.unref) timer.unref()
  }

  set(job: QueueJob): void {
    this.store.set(job.id, { ...job })
  }

  get(id: string): QueueJob | undefined {
    const job = this.store.get(id)
    return job ? { ...job } : undefined
  }

  update(id: string, updates: Partial<QueueJob>): void {
    const job = this.store.get(id)
    if (job) this.store.set(id, { ...job, ...updates })
  }

  size(): number {
    return this.store.size
  }

  private cleanup(): void {
    const cutoff = Date.now() - JOB_TTL_MS
    for (const [id, job] of Array.from(this.store)) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt !== undefined &&
        job.completedAt < cutoff
      ) {
        this.store.delete(id)
      }
    }
  }
}

// Singleton — persists across hot reloads in dev via globalThis
declare global {
  var __jobStore: JobStore | undefined
}

export const jobStore: JobStore = globalThis.__jobStore ?? new JobStore()
if (process.env.NODE_ENV !== 'production') {
  globalThis.__jobStore = jobStore
}
