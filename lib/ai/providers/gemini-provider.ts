/**
 * Gemini AI Provider — Nano Banana 2 (gemini-3.1-flash-image-preview)
 *
 * Wraps lib/ai/gemini.ts and implements the AIProvider interface.
 * To swap or add providers, create a new file here and register it in lib/queue/index.ts.
 *
 * Model limits: 100 RPM · 200K TPM · 1K RPD
 * Using 80 RPM (80%) to stay safely under the cap.
 */

import type { AIProvider, ProviderConfig, JobResult, JobType } from '@/lib/queue/types'
import { generateJewelryPhoto, type GenerationParams } from '@/lib/ai/gemini'

export class GeminiProvider implements AIProvider<GenerationParams> {
  readonly id    = 'gemini' as const
  readonly types: JobType[] = ['image']

  readonly config: ProviderConfig = {
    rpm:           80,                        // 80% of 100 RPM hard limit
    rpd:           1_000,                     // hard daily cap — fail immediately when hit
    maxConcurrent: 4,                         // Flash model handles more parallel requests
    retryDelays:   [3_000, 10_000, 30_000],  // faster backoff for flash model
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
