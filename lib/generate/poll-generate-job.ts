export interface GenerateJobPollResult {
  status: 'queued' | 'processing' | 'completed' | 'failed'
  error?: string | null
  outputUrl?: string | null
  panels?: Array<{ id: number; url: string; thumbUrl?: string }> | null
  isContactSheet?: boolean
  creditsRemaining?: number
}

const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 8 * 60 * 1000

export async function pollGenerateJob(
  generationId: string,
  statusToken?: string
): Promise<GenerateJobPollResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS

  while (Date.now() < deadline) {
    const query = statusToken ? `?token=${encodeURIComponent(statusToken)}` : ''
    const response = await fetch(`/api/generations/${generationId}${query}`, { cache: 'no-store' })
    const payload = await response.json() as GenerateJobPollResult & { error?: string }

    if (response.status === 404) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      continue
    }

    if (!response.ok) {
      throw new Error(payload.error ?? 'Не удалось получить статус генерации.')
    }

    if (payload.status === 'completed' || payload.status === 'failed') {
      return payload
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  throw new Error('Генерация заняла слишком много времени. Попробуйте снова.')
}
