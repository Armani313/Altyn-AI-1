/**
 * Gemini AI Provider
 *
 * Wraps lib/ai/gemini.ts and implements the AIProvider interface.
 * To swap or add providers, create a new file here and register it in lib/queue/index.ts.
 *
 * Rate limits (free tier): ~10 RPM, using 6 to stay safe.
 * Production: increase rpm in config when on a paid plan.
 */

import type { AIProvider, ProviderConfig, JobResult, JobType } from '@/lib/queue/types'
import { generateJewelryPhoto, type GenerationParams } from '@/lib/ai/gemini'

export class GeminiProvider implements AIProvider<GenerationParams> {
  readonly id    = 'gemini' as const
  readonly types: JobType[] = ['image']

  readonly config: ProviderConfig = {
    rpm:           6,                         // conservative — free tier ~10 RPM
    maxConcurrent: 1,                         // Gemini struggles with parallel requests
    retryDelays:   [5_000, 15_000, 40_000],  // backoff: 5s → 15s → 40s
  }

  async execute(params: GenerationParams): Promise<JobResult> {
    const result = await generateJewelryPhoto(params)
    return {
      imageBuffer:  result.imageBuffer,
      mimeType:     result.mimeType,
      predictionId: result.predictionId,
    }
  }
}
