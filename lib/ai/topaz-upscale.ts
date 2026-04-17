const TOPAZ_ENHANCE_URL = 'https://api.topazlabs.com/image/v1/enhance'
const TOPAZ_MODEL = 'Standard V2'
const TOPAZ_OUTPUT_FORMAT = 'png'

const SUPPORTED_TOPAZ_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/tiff',
])

export interface TopazEnhanceParams {
  imageBuffer: Uint8Array
  mimeType: string
  fileName: string
  outputWidth: number
  outputHeight: number
  model?: string
  fields?: Record<string, string | number | boolean | undefined>
}

interface TopazEnhanceResult {
  imageBuffer: Uint8Array
  mimeType: string
}

export async function enhanceImageWithTopaz({
  imageBuffer,
  mimeType,
  fileName,
  outputWidth,
  outputHeight,
  model = TOPAZ_MODEL,
  fields,
}: TopazEnhanceParams): Promise<TopazEnhanceResult> {
  const apiKey = process.env.TOPAZ_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('TOPAZ_API_KEY env var is not configured.')
  }

  if (!SUPPORTED_TOPAZ_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported Topaz input format: ${mimeType}`)
  }

  const body = new FormData()
  body.append(
    'image',
    new Blob([new Uint8Array(imageBuffer)], { type: mimeType }),
    fileName,
  )
  body.append('model', model)
  body.append('output_format', TOPAZ_OUTPUT_FORMAT)
  body.append('output_width', String(outputWidth))
  body.append('output_height', String(outputHeight))

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue
      body.append(key, String(value))
    }
  }

  const response = await fetch(TOPAZ_ENHANCE_URL, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
    },
    body,
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error('[topaz-upscale] API error:', response.status, text.slice(0, 500))

    if (response.status === 401 || response.status === 403) {
      throw new Error('Topaz API rejected the request. Check TOPAZ_API_KEY.')
    }
    if (response.status === 402) {
      throw new Error('Topaz billing is inactive or credits are unavailable.')
    }
    if (response.status === 413) {
      throw new Error('The image is too large for the enhancement API.')
    }
    if (response.status === 412) {
      throw new Error('Topaz could not satisfy the requested image settings.')
    }
    if (response.status === 415 || response.status === 422) {
      throw new Error('Topaz could not process this image. Try JPG or PNG.')
    }
    if (response.status === 425) {
      throw new Error('Topaz asked to retry the request later.')
    }
    if (response.status === 429) {
      throw new Error('Topaz rate limit reached. Try again in a minute.')
    }
    if (response.status >= 500) {
      throw new Error('Topaz service is temporarily unavailable.')
    }

    throw new Error(`Topaz returned HTTP ${response.status}.`)
  }

  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'
  const imageBufferResult = new Uint8Array(await response.arrayBuffer())

  if (!contentType.startsWith('image/')) {
    throw new Error('Topaz response did not contain an image.')
  }
  if (imageBufferResult.length === 0) {
    throw new Error('Topaz returned an empty image.')
  }

  return {
    imageBuffer: imageBufferResult,
    mimeType: contentType,
  }
}
