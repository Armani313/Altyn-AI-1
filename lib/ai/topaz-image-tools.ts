import { sleep } from '@/lib/utils'

const TOPAZ_IMAGE_BASE_URL = 'https://api.topazlabs.com/image/v1'
const DEFAULT_OUTPUT_FORMAT = 'png'
const STATUS_POLL_INTERVAL_MS = 2_000
const STATUS_POLL_TIMEOUT_MS = 180_000

const SUPPORTED_TOPAZ_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/tiff',
])

export type TopazAsyncEndpoint =
  | 'enhance'
  | 'enhance-gen'
  | 'sharpen'
  | 'sharpen-gen'
  | 'denoise'
  | 'lighting'
  | 'restore-gen'
  | 'tool'

export interface TopazAsyncImageParams {
  operation: 'topaz-async-image'
  endpoint: TopazAsyncEndpoint
  model: string
  imageBuffer: Uint8Array
  mimeType: string
  fileName: string
  outputWidth?: number
  outputHeight?: number
  fields?: Record<string, string | number | boolean | undefined>
  timeoutMs?: number
}

interface TopazAsyncSubmitResponse {
  process_id?: string
  processId?: string
  request_id?: string
  requestId?: string
  status?: string
  error?: string
  message?: string
}

interface TopazStatusResponse {
  status?: string
  state?: string
  error?: string
  message?: string
}

interface TopazAsyncResult {
  imageBuffer: Uint8Array
  mimeType: string
}

function getApiKey(): string {
  const apiKey = process.env.TOPAZ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('TOPAZ_API_KEY env var is not configured.')
  }
  return apiKey
}

function assertTopazMimeType(mimeType: string): void {
  if (!SUPPORTED_TOPAZ_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported Topaz input format: ${mimeType}`)
  }
}

function appendFormField(
  formData: FormData,
  key: string,
  value: string | number | boolean | undefined,
): void {
  if (value === undefined) return
  formData.append(key, String(value))
}

function mapTopazHttpError(status: number, text: string): never {
  console.error('[topaz-image-tools] API error:', status, text.slice(0, 500))

  if (status === 401 || status === 403) {
    throw new Error('Topaz API rejected the request. Check TOPAZ_API_KEY.')
  }
  if (status === 413) {
    throw new Error('The image is too large for the enhancement API.')
  }
  if (status === 415 || status === 422) {
    throw new Error('Topaz could not process this image. Try JPG or PNG.')
  }
  if (status === 429) {
    throw new Error('Topaz rate limit reached. Try again in a minute.')
  }

  throw new Error(`Topaz returned HTTP ${status}.`)
}

function getProcessId(payload: TopazAsyncSubmitResponse): string | null {
  return payload.process_id ?? payload.processId ?? payload.request_id ?? payload.requestId ?? null
}

function isCompletedStatus(status: string): boolean {
  const normalized = status.toLowerCase()
  return normalized.includes('complete') || normalized === 'done' || normalized === 'success'
}

function isFailedStatus(status: string): boolean {
  const normalized = status.toLowerCase()
  return normalized.includes('fail') || normalized.includes('error') || normalized === 'cancelled'
}

async function submitTopazAsyncJob({
  endpoint,
  model,
  imageBuffer,
  mimeType,
  fileName,
  outputWidth,
  outputHeight,
  fields,
}: TopazAsyncImageParams): Promise<string> {
  const apiKey = getApiKey()
  assertTopazMimeType(mimeType)

  const formData = new FormData()
  formData.append(
    'image',
    new Blob([new Uint8Array(imageBuffer)], { type: mimeType }),
    fileName,
  )
  formData.append('model', model)
  formData.append('output_format', DEFAULT_OUTPUT_FORMAT)
  appendFormField(formData, 'output_width', outputWidth)
  appendFormField(formData, 'output_height', outputHeight)

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      appendFormField(formData, key, value)
    }
  }

  const response = await fetch(`${TOPAZ_IMAGE_BASE_URL}/${endpoint}/async`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
    },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    mapTopazHttpError(response.status, text)
  }

  const payload = await response.json().catch(() => null) as TopazAsyncSubmitResponse | null
  const processId = payload ? getProcessId(payload) : null

  if (!processId) {
    throw new Error(payload?.error || payload?.message || 'Topaz did not return a process ID.')
  }

  return processId
}

async function waitForTopazAsyncJob(processId: string, timeoutMs: number): Promise<void> {
  const apiKey = getApiKey()
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const response = await fetch(`${TOPAZ_IMAGE_BASE_URL}/status/${processId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      mapTopazHttpError(response.status, text)
    }

    const payload = await response.json().catch(() => null) as TopazStatusResponse | null
    const status = payload?.status ?? payload?.state ?? ''

    if (!status) {
      await sleep(STATUS_POLL_INTERVAL_MS)
      continue
    }

    if (isCompletedStatus(status)) {
      return
    }

    if (isFailedStatus(status)) {
      throw new Error(payload?.error || payload?.message || 'Topaz failed to process the image.')
    }

    await sleep(STATUS_POLL_INTERVAL_MS)
  }

  throw new Error('The operation was aborted due to timeout')
}

async function downloadTopazAsyncResult(processId: string): Promise<TopazAsyncResult> {
  const apiKey = getApiKey()
  const response = await fetch(`${TOPAZ_IMAGE_BASE_URL}/download/${processId}`, {
    headers: {
      'X-API-Key': apiKey,
    },
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    mapTopazHttpError(response.status, text)
  }

  const payload = await response.json().catch(() => null) as { download_url?: string; downloadUrl?: string } | null
  const downloadUrl = payload?.download_url ?? payload?.downloadUrl

  if (!downloadUrl) {
    throw new Error('Topaz did not return a download URL.')
  }

  const downloadResponse = await fetch(downloadUrl, {
    signal: AbortSignal.timeout(60_000),
  })

  if (!downloadResponse.ok) {
    const text = await downloadResponse.text().catch(() => '')
    throw new Error(`Topaz download failed with HTTP ${downloadResponse.status}: ${text.slice(0, 200)}`)
  }

  const contentType = downloadResponse.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
  const imageBuffer = new Uint8Array(await downloadResponse.arrayBuffer())

  if (!contentType.startsWith('image/')) {
    throw new Error('Topaz response did not contain an image.')
  }
  if (imageBuffer.length === 0) {
    throw new Error('Topaz returned an empty image.')
  }

  return {
    imageBuffer,
    mimeType: contentType,
  }
}

export async function processTopazAsyncImage(params: TopazAsyncImageParams): Promise<TopazAsyncResult> {
  const processId = await submitTopazAsyncJob(params)
  await waitForTopazAsyncJob(processId, params.timeoutMs ?? STATUS_POLL_TIMEOUT_MS)
  return downloadTopazAsyncResult(processId)
}
