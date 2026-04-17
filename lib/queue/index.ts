/**
 * AI Generation Queue — Public API
 *
 * Usage:
 *   import { aiQueue } from '@/lib/queue'
 *   const job = aiQueue.enqueue({ userId, providerId: 'gemini', type: 'image', params })
 *   const done = await aiQueue.waitForJob(job.id)        // sync (images)
 *   // — or —
 *   return { jobId: job.id }                             // async (video): client polls /api/jobs/[id]
 *
 * Adding a new provider (e.g. Kling for video):
 *   1. Create lib/ai/providers/kling-provider.ts implementing AIProvider
 *   2. Import and register it below
 *   3. Use providerId: 'kling', type: 'video' when enqueuing
 */

import { queueManager } from './queue-manager'
import { GeminiProvider } from '@/lib/ai/providers/gemini-provider'
import { TopazProvider } from '@/lib/ai/providers/topaz-provider'

declare global {
  var __aiQueueProvidersRegistered: boolean | undefined
  var __aiQueueInitPromise: Promise<void> | undefined
}

// ── Register providers ────────────────────────────────────────────────────────
if (!globalThis.__aiQueueProvidersRegistered) {
  queueManager.registerProvider(new GeminiProvider())
  queueManager.registerProvider(new TopazProvider())
  globalThis.__aiQueueProvidersRegistered = true
}

// ── Startup init (fire-and-forget) ────────────────────────────────────────────
// Seeds RPD counter from DB and recovers stuck generations after a restart.
// Guarded globally so polling routes do not re-run init on every hot reload/import.
if (!globalThis.__aiQueueInitPromise) {
  globalThis.__aiQueueInitPromise = queueManager.init()
}

// Future providers (uncomment when ready):
// import { KlingProvider }     from '@/lib/ai/providers/kling-provider'
// import { RunwayProvider }    from '@/lib/ai/providers/runway-provider'
// import { ReplicateProvider } from '@/lib/ai/providers/replicate-provider'
// queueManager.registerProvider(new KlingProvider())
// queueManager.registerProvider(new RunwayProvider())

// ── Public API ────────────────────────────────────────────────────────────────

export const aiQueue = queueManager

export type { QueueJob, ProviderId, JobType, JobResult, EnqueueOptions } from './types'
