/**
 * Replicate AI Provider
 *
 * Supports two model-reference formats via environment variables:
 *
 *   REPLICATE_MODEL_VERSION  — full version SHA (e.g. "39ed52f2...")
 *     → uses POST /v1/predictions  with { version: sha, input }
 *
 *   REPLICATE_MODEL          — owner/name slug (e.g. "stability-ai/sdxl")
 *     → uses POST /v1/models/{owner}/{name}/predictions  with { input }
 *       (required for official Replicate-hosted models that don't expose a SHA)
 *
 * Set one or the other. REPLICATE_MODEL_VERSION takes priority if both are set.
 *
 * Recommended models for jewelry img2img:
 *   stability-ai/sdxl           — best overall quality
 *   lucataco/sdxl-controlnet    — precise composition control
 */

// ── Prompt templates per jewelry category ────────────────────────────────────

const CATEGORY_PROMPTS: Record<string, string> = {
  rings:
    'Professional lifestyle photograph, elegant female hand wearing a beautiful ring, ' +
    'soft warm studio lighting, cream and ivory background, high-end jewelry editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',

  necklaces:
    'Professional lifestyle photograph, elegant necklace on a female neck and décolletage, ' +
    'soft warm studio lighting, cream background, high-end jewelry editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',

  earrings:
    'Professional lifestyle photograph, close-up side profile of a female ear with elegant earrings, ' +
    'soft warm studio lighting, cream background, high-end jewelry editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',

  bracelets:
    'Professional lifestyle photograph, elegant female wrist wearing a beautiful bracelet, ' +
    'soft warm studio lighting, cream background, high-end jewelry editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',

  universal:
    'Professional lifestyle photograph of elegant jewelry being worn, ' +
    'soft warm studio lighting, cream and ivory background, high-end editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',
}

const NEGATIVE_PROMPT =
  'blurry, low quality, amateur, low resolution, watermark, text, logo, ' +
  'cartoon, illustration, ugly, distorted, bad anatomy, extra fingers, mutated hands'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReplicatePrediction {
  id:     string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string[] | null
  error:  string | null
  urls:   { get: string; cancel: string }
}

export interface GenerationParams {
  /** Public or signed URL to the source jewelry image */
  imageUrl:         string
  /** Category from our templates: rings | necklaces | earrings | bracelets */
  templateCategory: string
  /** prompt_strength 0–1: how much to deviate from the source image */
  promptStrength?:  number
}

export interface GenerationResult {
  outputUrl:    string
  predictionId: string
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Starts an image-to-image generation and waits for the result (up to 55 s).
 * Throws a Russian-language Error on failure.
 */
export async function generateJewelryPhoto(
  params: GenerationParams
): Promise<GenerationResult> {
  const token        = process.env.REPLICATE_API_TOKEN
  const modelVersion = process.env.REPLICATE_MODEL_VERSION?.trim()
  const modelSlug    = process.env.REPLICATE_MODEL?.trim()

  if (!token) {
    throw new Error('Сервис генерации временно недоступен. Обратитесь в поддержку.')
  }

  if (!modelVersion && !modelSlug) {
    throw new Error(
      'Модель ИИ не настроена. Укажите REPLICATE_MODEL_VERSION или REPLICATE_MODEL в .env.local.'
    )
  }

  const prompt = CATEGORY_PROMPTS[params.templateCategory] ?? CATEGORY_PROMPTS.universal

  const input = {
    image:              params.imageUrl,
    prompt,
    negative_prompt:    NEGATIVE_PROMPT,
    prompt_strength:    params.promptStrength ?? 0.55,
    num_inference_steps: 30,
    guidance_scale:     7.5,
    scheduler:          'DPMSolverMultistep',
    seed:               Math.floor(Math.random() * 2 ** 32),
  }

  // Determine endpoint based on which env var is set
  const { url, body } = modelVersion
    ? {
        url:  'https://api.replicate.com/v1/predictions',
        body: JSON.stringify({ version: modelVersion, input }),
      }
    : {
        // modelSlug is "owner/name"
        url:  `https://api.replicate.com/v1/models/${modelSlug}/predictions`,
        body: JSON.stringify({ input }),
      }

  const createRes = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Token ${token}`,
      'Content-Type': 'application/json',
      Prefer:         'wait=55', // hold connection up to 55 s for sync result
    },
    body,
    signal: AbortSignal.timeout(58_000),
  })

  if (!createRes.ok) {
    const errBody = await createRes.json().catch(() => ({})) as { detail?: string }
    console.error('Replicate create error:', errBody)
    throw new Error('Ошибка при запуске генерации. Попробуйте снова через несколько секунд.')
  }

  const prediction = (await createRes.json()) as ReplicatePrediction

  // Prefer:wait resolved synchronously
  if (prediction.status === 'succeeded' && prediction.output?.[0]) {
    return { outputUrl: prediction.output[0], predictionId: prediction.id }
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(
      prediction.error ?? 'Генерация завершилась с ошибкой. Попробуйте другой шаблон.'
    )
  }

  // Model didn't finish within 55 s — fall back to polling
  return pollUntilDone(prediction.id, token)
}

// ── Polling ───────────────────────────────────────────────────────────────────

async function pollUntilDone(
  predictionId: string,
  token: string,
  maxAttempts = 25
): Promise<GenerationResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2_000)

    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      { headers: { Authorization: `Token ${token}` } }
    )

    if (!res.ok) continue

    const prediction = (await res.json()) as ReplicatePrediction

    if (prediction.status === 'succeeded' && prediction.output?.[0]) {
      return { outputUrl: prediction.output[0], predictionId: prediction.id }
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(
        prediction.error ?? 'Генерация завершилась с ошибкой. Попробуйте другой шаблон.'
      )
    }
  }

  throw new Error(
    'Превышено время ожидания генерации. Попробуйте снова — обычно занимает 5–10 секунд.'
  )
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
