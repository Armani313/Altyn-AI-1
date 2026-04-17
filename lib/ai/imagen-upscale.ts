/**
 * imagen-upscale.ts
 *
 * Upscales an image to 4K using Vertex AI imagen-4.0-upscale-preview.
 * Authenticated via a Google Cloud service account (JSON env var).
 *
 * Required env vars:
 *   VERTEX_AI_PROJECT_ID  — GCP project ID
 *   VERTEX_AI_LOCATION    — region, e.g. "us-central1"
 *   GOOGLE_SERVICE_ACCOUNT_JSON — full service account JSON as a string
 *                                 (set via Docker secret / .env.local)
 *
 * Upscale factor: x4  (1K → 4K, ≈16 MP — within the 17 MP API limit)
 * Output format:  PNG  (lossless, no compression artifacts)
 */

import { GoogleAuth } from 'google-auth-library'

const MODEL = 'imagen-4.0-upscale-preview'

// CRITICAL-1: allowlist of valid GCP regions — prevents env-var injection into URL
const VALID_GCP_REGIONS = new Set([
  'us-central1', 'us-east1', 'us-east4', 'us-west1', 'us-west2', 'us-west4',
  'northamerica-northeast1', 'southamerica-east1',
  'europe-west1', 'europe-west2', 'europe-west3', 'europe-west4', 'europe-west6',
  'europe-north1', 'europe-central2',
  'asia-east1', 'asia-east2', 'asia-northeast1', 'asia-northeast2', 'asia-northeast3',
  'asia-southeast1', 'asia-southeast2', 'asia-south1',
  'australia-southeast1',
])
// GCP project IDs: 6–30 chars, lowercase letters/digits/hyphens, start with letter
const GCP_PROJECT_ID_REGEX = /^[a-z][a-z0-9\-]{4,28}[a-z0-9]$/

interface UpscaleResult {
  imageBuffer: Buffer
  mimeType:    'image/png'
}

/**
 * Sends a 1K image to Vertex AI Imagen upscale and returns a 4K PNG buffer.
 * @param imageBuffer  Raw bytes of the source 1K panel (JPEG or PNG)
 * @param sourceMime   MIME type of the source image ('image/jpeg' | 'image/png')
 */
export async function upscaleToFourK(
  imageBuffer: Buffer,
): Promise<UpscaleResult> {
  const projectId = process.env.VERTEX_AI_PROJECT_ID
  const location  = process.env.VERTEX_AI_LOCATION ?? 'us-central1'
  const saJson    = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!projectId) throw new Error('VERTEX_AI_PROJECT_ID env var is not set.')
  if (!saJson)    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set.')

  // CRITICAL-1: validate env vars against allowlists BEFORE building URL
  if (!GCP_PROJECT_ID_REGEX.test(projectId)) {
    throw new Error('VERTEX_AI_PROJECT_ID has invalid format — must be a valid GCP project ID.')
  }
  if (!VALID_GCP_REGIONS.has(location)) {
    throw new Error(`VERTEX_AI_LOCATION "${location}" is not a recognised GCP region.`)
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  let credentials: object
  try {
    credentials = JSON.parse(saJson)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.')
  }

  const auth = new GoogleAuth({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credentials: credentials as any,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client      = await auth.getClient()
  const tokenResult = await client.getAccessToken()
  const accessToken = tokenResult.token

  if (!accessToken) throw new Error('Failed to obtain Google Cloud access token.')

  // ── Request body ──────────────────────────────────────────────────────────
  const base64Image = imageBuffer.toString('base64')

  const body = JSON.stringify({
    instances: [{
      image: {
        bytesBase64Encoded: base64Image,
      },
    }],
    parameters: {
      mode: 'upscale',
      upscaleConfig: {
        upscaleFactor: 'x4',
      },
      outputOptions: {
        mimeType: 'image/png',
      },
    },
  })

  // ── API call ──────────────────────────────────────────────────────────────
  const endpoint =
    `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}` +
    `/locations/${location}/publishers/google/models/${MODEL}:predict`

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body,
    signal: AbortSignal.timeout(120_000), // upscale can take ~60–90s
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[imagen-upscale] API error:', res.status, text.slice(0, 500))
    if (res.status === 429) throw new Error('Превышен лимит Vertex AI. Попробуйте через минуту.')
    if (res.status === 403) throw new Error('Нет доступа к Vertex AI. Проверьте настройки GCP.')
    throw new Error(`Vertex AI вернул ошибку ${res.status}. Попробуйте снова.`)
  }

  // ── Parse response ────────────────────────────────────────────────────────
  const data = await res.json() as { predictions?: Array<{ bytesBase64Encoded?: string }> }

  const b64 = data.predictions?.[0]?.bytesBase64Encoded
  if (!b64) {
    console.error('[imagen-upscale] no image in response:', JSON.stringify(data).slice(0, 300))
    throw new Error('Vertex AI не вернул изображение. Попробуйте снова.')
  }

  return {
    imageBuffer: Buffer.from(b64, 'base64'),
    mimeType:    'image/png',
  }
}
