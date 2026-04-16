import { VIDEO_MODEL } from '@/lib/video/constants'
import type {
  VideoAspectRatioOption,
  VideoDurationOption,
  VideoResolutionOption,
} from '@/lib/video/options'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

interface VeoStartResponse {
  name?: string
}

interface VeoOperationError {
  message?: string
}

interface VeoOperationResponse {
  done?: boolean
  error?: VeoOperationError
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: {
          uri?: string
        }
      }>
    }
    generatedVideos?: Array<{
      video?: {
        uri?: string
      }
    }>
  }
}

export interface StartVeoVideoParams {
  prompt: string
  imageBuffer: Buffer
  imageMimeType: string
  aspectRatio: VideoAspectRatioOption
  durationSeconds: VideoDurationOption
  resolution: VideoResolutionOption
  negativePrompt?: string
}

export interface VeoOperationResult {
  status: 'processing' | 'completed' | 'failed'
  videoUri?: string
  error?: string
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY env var is not configured.')
  }
  return apiKey
}

function buildOperationUrl(operationName: string) {
  const apiKey = getApiKey()
  return `${GEMINI_API_BASE}/${operationName}?key=${apiKey}`
}

function extractVideoUri(payload: VeoOperationResponse): string | null {
  const generatedSampleUri = payload.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
  if (typeof generatedSampleUri === 'string' && generatedSampleUri.length > 0) {
    return generatedSampleUri
  }

  const generatedVideoUri = payload.response?.generatedVideos?.[0]?.video?.uri
  if (typeof generatedVideoUri === 'string' && generatedVideoUri.length > 0) {
    return generatedVideoUri
  }

  return null
}

export async function startVeoVideoGeneration(
  params: StartVeoVideoParams
): Promise<{ operationName: string }> {
  const apiKey = getApiKey()
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${VIDEO_MODEL}:predictLongRunning`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: params.prompt,
            image: {
              bytesBase64Encoded: params.imageBuffer.toString('base64'),
              mimeType: params.imageMimeType,
            },
          },
        ],
        parameters: {
          aspectRatio: params.aspectRatio,
          durationSeconds: params.durationSeconds,
          resolution: params.resolution,
          ...(params.negativePrompt ? { negativePrompt: params.negativePrompt } : {}),
        },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Veo start request failed (${response.status}): ${text.slice(0, 240) || 'empty response'}`
    )
  }

  const data = await response.json() as VeoStartResponse
  if (!data.name) {
    throw new Error('Veo did not return an operation name.')
  }

  return { operationName: data.name }
}

export async function getVeoOperation(
  operationName: string
): Promise<VeoOperationResult> {
  const response = await fetch(buildOperationUrl(operationName), {
    headers: {
      'x-goog-api-key': getApiKey(),
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Veo operation request failed (${response.status}): ${text.slice(0, 240) || 'empty response'}`
    )
  }

  const payload = await response.json() as VeoOperationResponse

  if (!payload.done) {
    return { status: 'processing' }
  }

  if (payload.error?.message) {
    return { status: 'failed', error: payload.error.message }
  }

  const videoUri = extractVideoUri(payload)
  if (!videoUri) {
    return { status: 'failed', error: 'Veo completed without a downloadable video URI.' }
  }

  return { status: 'completed', videoUri }
}

export async function downloadVeoVideo(videoUri: string): Promise<Buffer> {
  const parsed = new URL(videoUri)
  if (parsed.protocol !== 'https:') {
    throw new Error('Veo returned a non-HTTPS video URL.')
  }

  const response = await fetch(videoUri, {
    headers: {
      'x-goog-api-key': getApiKey(),
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(180_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Veo video download failed (${response.status}): ${text.slice(0, 240) || 'empty response'}`
    )
  }

  return Buffer.from(await response.arrayBuffer())
}
