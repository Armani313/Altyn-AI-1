import type { VideoGenerationPollResponse } from '@/lib/video/types'

export async function fetchVideoGenerationStatus(
  generationId: string
): Promise<VideoGenerationPollResponse> {
  const response = await fetch(`/api/video-generations/${generationId}`, {
    cache: 'no-store',
    credentials: 'same-origin',
  })

  const data = await response.json() as Partial<VideoGenerationPollResponse> & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? 'Video status request failed.')
  }

  return {
    generationId,
    status: (data.status ?? 'failed') as VideoGenerationPollResponse['status'],
    outputVideoUrl: data.outputVideoUrl ?? null,
    posterUrl: data.posterUrl ?? null,
    creditsRemaining: typeof data.creditsRemaining === 'number' ? data.creditsRemaining : null,
    error: data.error ?? null,
  }
}

export async function pollVideoGenerationUntilDone(
  generationId: string,
  {
    intervalMs = 10_000,
    timeoutMs = 8 * 60_000,
    onTick,
  }: {
    intervalMs?: number
    timeoutMs?: number
    onTick?: (result: VideoGenerationPollResponse) => void
  } = {}
): Promise<VideoGenerationPollResponse> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const result = await fetchVideoGenerationStatus(generationId)
    onTick?.(result)

    if (result.status === 'completed' || result.status === 'failed') {
      return result
    }

    await new Promise<void>((resolve) => window.setTimeout(resolve, intervalMs))
  }

  throw new Error('Timed out while waiting for video generation.')
}
