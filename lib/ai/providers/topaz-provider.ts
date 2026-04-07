import type { AIProvider, JobResult, JobType, ProviderConfig } from '@/lib/queue/types'
import { enhanceImageWithTopaz, type TopazEnhanceParams } from '@/lib/ai/topaz-upscale'
import { processTopazAsyncImage, type TopazAsyncImageParams } from '@/lib/ai/topaz-image-tools'

type TopazProviderParams = TopazEnhanceParams | TopazAsyncImageParams

function isAsyncTopazImageParams(params: TopazProviderParams): params is TopazAsyncImageParams {
  return 'operation' in params && params.operation === 'topaz-async-image'
}

export class TopazProvider implements AIProvider<TopazProviderParams> {
  readonly id = 'topaz' as const
  readonly types: JobType[] = ['image']

  readonly config: ProviderConfig = {
    rpm: 60,
    maxConcurrent: 2,
    retryDelays: [5_000, 15_000, 30_000],
  }

  async execute(params: TopazProviderParams): Promise<JobResult> {
    const result = isAsyncTopazImageParams(params)
      ? await processTopazAsyncImage(params)
      : await enhanceImageWithTopaz(params)

    return {
      imageBuffer: Buffer.from(result.imageBuffer),
      mimeType: result.mimeType,
    }
  }
}
