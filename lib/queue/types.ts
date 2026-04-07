/**
 * AI Generation Queue — Core Types
 *
 * Designed for extensibility:
 *   - Add new providers: implement AIProvider<TParams>
 *   - Add new job types: extend JobType ('image' | 'video' | ...)
 */

// ── Job lifecycle ─────────────────────────────────────────────────────────────

export type JobStatus  = 'queued' | 'processing' | 'completed' | 'failed'
export type JobType    = 'image'  | 'video'
export type ProviderId = 'gemini' | 'topaz' | 'kling' | 'runway' | 'replicate'

export interface JobResult {
  /** Filled for image jobs */
  imageBuffer?:  Buffer
  mimeType?:     string
  /** Filled for video jobs */
  videoUrl?:     string
  predictionId?: string
}

export interface QueueJob {
  id:           string
  userId:       string
  providerId:   ProviderId
  type:         JobType
  /** Higher number = higher priority */
  priority:     number
  status:       JobStatus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params:       any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?:        any
  result?:      JobResult
  error?:       string
  createdAt:    number
  startedAt?:   number
  completedAt?: number
  attempts:     number
  maxAttempts:  number
  /** Internal: earliest time this job can be retried (ms since epoch) */
  _retryAfter?: number
}

// ── Provider interface ────────────────────────────────────────────────────────

export interface ProviderConfig {
  /** Max requests per minute (token bucket) */
  rpm:            number
  /** Max requests per day — hard cap, jobs fail immediately when exhausted */
  rpd?:           number
  /** Max simultaneously in-flight requests to this provider */
  maxConcurrent:  number
  /** Backoff delays in ms between retries — e.g. [3000, 10000, 30000] */
  retryDelays:    number[]
}

export interface AIProvider<TParams = unknown> {
  readonly id:     ProviderId
  /** Job types this provider supports */
  readonly types:  JobType[]
  readonly config: ProviderConfig
  execute(params: TParams): Promise<JobResult>
}

// ── Enqueue options ───────────────────────────────────────────────────────────

export interface EnqueueOptions {
  userId:      string
  providerId:  ProviderId
  type:        JobType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params:      any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?:       any
  /** Default: 0 */
  priority?:   number
  /** Default: 3 */
  maxAttempts?: number
}
