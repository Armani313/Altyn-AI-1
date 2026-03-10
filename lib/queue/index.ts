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

// ── Register providers ────────────────────────────────────────────────────────

// Image generation
queueManager.registerProvider(new GeminiProvider())

// Future providers (uncomment when ready):
// import { KlingProvider }     from '@/lib/ai/providers/kling-provider'
// import { RunwayProvider }    from '@/lib/ai/providers/runway-provider'
// import { ReplicateProvider } from '@/lib/ai/providers/replicate-provider'
// queueManager.registerProvider(new KlingProvider())
// queueManager.registerProvider(new RunwayProvider())

// ── Public API ────────────────────────────────────────────────────────────────

export const aiQueue = queueManager

export type { QueueJob, ProviderId, JobType, JobResult, EnqueueOptions } from './types'
