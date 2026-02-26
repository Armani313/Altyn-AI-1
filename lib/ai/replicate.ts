/**
 * Replicate AI Provider
 *
 * Handles image-to-image generation for jewelry lifestyle photos.
 * Swap this module for any other provider (fal.ai, Stability AI, etc.)
 * by implementing the same exported interface.
 *
 * Model configuration:
 *   REPLICATE_API_TOKEN      — your Replicate token (replicate.com/account)
 *   REPLICATE_MODEL_VERSION  — full version SHA of the chosen model
 *
 * Recommended models for jewelry img2img:
 *   - stability-ai/sdxl (img2img variant): best quality
 *   - lucataco/sdxl-controlnet: precise composition control
 *   - fofr/sticker-maker: style transfer, works well for jewellery
 *
 * NOTE: "Google Nano Banana" is not a real product. The prompt templates
 * below are architected to produce the same lifestyle-photography result
 * with any standard diffusion model hosted on Replicate.
 */

// ── Prompt templates per jewelry category ────────────────────────────────────

const CATEGORY_PROMPTS: Record<string, string> = {
  rings:
    'Professional lifestyle photograph, elegant female hand wearing a beautiful ring, ' +
    'soft warm studio lighting, cream and ivory background, high-end jewelry editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',

  necklaces:
    'Professional lifestyle photograph, elegant necklace draped around a female neck and décolletage, ' +
    'soft warm studio lighting, cream background, high-end jewelry editorial, ' +
    '8k resolution, sharp focus, luxury fashion photography',

  earrings:
    'Professional lifestyle photograph, close-up side profile of a female ear wearing elegant earrings, ' +
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

// ── Replicate types ───────────────────────────────────────────────────────────

export interface ReplicatePrediction {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output: string[] | null
  error: string | null
  urls: { get: string; cancel: string }
}

export interface GenerationParams {
  /** Public or signed URL to the source jewelry image */
  imageUrl: string
  /** Category from our templates table */
  templateCategory: string
  /** prompt_strength 0-1: how much to deviate from source image */
  promptStrength?: number
}

export interface GenerationResult {
  outputUrl: string
  predictionId: string
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Starts an image generation and waits for the result (up to 55 seconds).
 * Throws a Russian-language error string on failure.
 */
export async function generateJewelryPhoto(
  params: GenerationParams
): Promise<GenerationResult> {
  const token = process.env.REPLICATE_API_TOKEN
  const modelVersion = process.env.REPLICATE_MODEL_VERSION

  if (!token || !modelVersion) {
    throw new Error(
      'Сервис генерации временно недоступен. Обратитесь в поддержку.'
    )
  }

  const prompt =
    CATEGORY_PROMPTS[params.templateCategory] ?? CATEGORY_PROMPTS.universal

  // Create prediction — Prefer: wait instructs Replicate to hold the connection
  // up to 60 s and return the output directly if the model finishes in time.
  const createRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=55',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image: params.imageUrl,
        prompt,
        negative_prompt: NEGATIVE_PROMPT,
        prompt_strength: params.promptStrength ?? 0.55,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        scheduler: 'DPMSolverMultistep',
        seed: Math.floor(Math.random() * 2 ** 32),
      },
    }),
    signal: AbortSignal.timeout(58_000),
  })

  if (!createRes.ok) {
    const body = await createRes.json().catch(() => ({}))
    const detail = (body as { detail?: string }).detail
    console.error('Replicate create error:', detail)
    throw new Error(
      'Ошибка при запуске генерации. Попробуйте снова через несколько секунд.'
    )
  }

  const prediction = (await createRes.json()) as ReplicatePrediction

  // If the Prefer:wait resolved immediately — great, return directly
  if (prediction.status === 'succeeded' && prediction.output?.[0]) {
    return { outputUrl: prediction.output[0], predictionId: prediction.id }
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(
      prediction.error ?? 'Генерация завершилась с ошибкой. Попробуйте другой шаблон.'
    )
  }

  // Otherwise — poll until complete
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
        prediction.error ??
          'Генерация завершилась с ошибкой. Попробуйте другой шаблон.'
      )
    }
  }

  throw new Error(
    'Превышено время ожидания генерации. Попробуйте снова — это обычно занимает 5–10 секунд.'
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
