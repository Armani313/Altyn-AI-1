/**
 * Google Gemini AI Provider
 *
 * Model: Gemini 2.5 Flash Preview (image generation / Nano Banana)
 *
 * Set in .env.local:
 *   GEMINI_API_KEY   — your Google AI Studio API key
 *   GEMINI_MODEL     — optional override (default: gemini-2.5-flash-preview-04-17)
 *
 * Flow: source image → base64 → Gemini generateContent → base64 result → Buffer
 * No external URL fetch needed — result is returned inline as bytes.
 */

const DEFAULT_MODEL = 'gemini-2.5-flash-image'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ── Prompt templates per jewelry category ─────────────────────────────────────

const CATEGORY_PROMPTS: Record<string, string> = {
  rings:
    'You are a professional jewelry photographer. ' +
    'Using this product photo as reference, generate a professional lifestyle photograph ' +
    'showing this exact ring being worn on an elegant female hand. ' +
    'Style: soft warm studio lighting, cream and ivory background, ' +
    'high-end jewelry editorial, 8k resolution, sharp focus, luxury fashion photography. ' +
    'Preserve the jewelry design exactly — do not alter the ring shape, stones, or metalwork.',

  necklaces:
    'You are a professional jewelry photographer. ' +
    'Using this product photo as reference, generate a professional lifestyle photograph ' +
    'showing this exact necklace worn on an elegant female neck and décolletage. ' +
    'Style: soft warm studio lighting, cream background, ' +
    'high-end jewelry editorial, 8k resolution, sharp focus, luxury fashion photography. ' +
    'Preserve the jewelry design exactly.',

  earrings:
    'You are a professional jewelry photographer. ' +
    'Using this product photo as reference, generate a professional lifestyle photograph ' +
    'showing these exact earrings on an elegant female ear, close-up side profile. ' +
    'Style: soft warm studio lighting, cream background, ' +
    'high-end jewelry editorial, 8k resolution, sharp focus, luxury fashion photography. ' +
    'Preserve the jewelry design exactly.',

  bracelets:
    'You are a professional jewelry photographer. ' +
    'Using this product photo as reference, generate a professional lifestyle photograph ' +
    'showing this exact bracelet worn on an elegant female wrist. ' +
    'Style: soft warm studio lighting, cream background, ' +
    'high-end jewelry editorial, 8k resolution, sharp focus, luxury fashion photography. ' +
    'Preserve the jewelry design exactly.',

  universal:
    'You are a professional jewelry photographer. ' +
    'Using this product photo as reference, generate a professional lifestyle photograph ' +
    'showing this exact jewelry piece being worn elegantly. ' +
    'Style: soft warm studio lighting, cream and ivory background, ' +
    'high-end editorial, 8k resolution, sharp focus, luxury fashion photography. ' +
    'Preserve the jewelry design exactly.',
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerationParams {
  /** Public or signed URL to the source jewelry image */
  imageUrl:         string
  /** Category: rings | necklaces | earrings | bracelets | universal */
  templateCategory: string
}

export interface GenerationResult {
  /** Raw image bytes returned by Gemini — upload directly to storage */
  imageBuffer:  Buffer
  mimeType:     string
  predictionId: string
}

// ── Gemini API response shape ─────────────────────────────────────────────────

interface GeminiPart {
  inlineData?: { mimeType: string; data: string }
  text?:       string
}

interface GeminiResponse {
  candidates?: Array<{ content: { parts: GeminiPart[] } }>
  error?:      { message?: string; code?: number }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates a lifestyle jewelry photo via Gemini image generation.
 * Downloads the source image, sends it as base64, returns image bytes directly.
 * Throws a Russian-language Error on failure.
 */
export async function generateJewelryPhoto(
  params: GenerationParams
): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Сервис генерации временно недоступен. Обратитесь в поддержку.')
  }

  const model = (process.env.GEMINI_MODEL ?? DEFAULT_MODEL).trim()

  // ── 1. Download source image ───────────────────────────────────────────────
  const imageRes = await fetch(params.imageUrl, {
    signal: AbortSignal.timeout(30_000),
  })
  if (!imageRes.ok) {
    throw new Error('Не удалось загрузить исходное изображение для обработки.')
  }

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer())
  const mimeType    = imageRes.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
  const base64Image = imageBuffer.toString('base64')

  // ── 2. Call Gemini ─────────────────────────────────────────────────────────
  const prompt = CATEGORY_PROMPTS[params.templateCategory] ?? CATEGORY_PROMPTS.universal

  const body = JSON.stringify({
    contents: [{
      parts: [
        { inlineData: { mimeType, data: base64Image } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  })

  const res = await fetch(
    `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal:  AbortSignal.timeout(60_000),
    }
  )

  const data = (await res.json()) as GeminiResponse

  if (!res.ok) {
    console.error('Gemini API error:', data.error)
    throw new Error(
      data.error?.message ?? 'Ошибка при генерации изображения. Попробуйте снова.'
    )
  }

  // ── 3. Extract image from response ─────────────────────────────────────────
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData) {
    console.error('Gemini returned no image part:', JSON.stringify(data).slice(0, 500))
    throw new Error(
      'Модель не вернула изображение. Попробуйте другой тип украшения или загрузите другое фото.'
    )
  }

  return {
    imageBuffer:  Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType:     imagePart.inlineData.mimeType,
    predictionId: `gemini-${Date.now()}`,
  }
}
