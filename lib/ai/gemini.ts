/**
 * Google Gemini AI Provider
 *
 * Model: Gemini 2.5 Flash Image (nano-banana-pro-preview)
 *
 * Two modes:
 *   1. Model-based  — two images sent (model photo + jewelry photo).
 *                     Gemini composites the jewelry onto the model.
 *   2. Standalone   — one image sent (jewelry photo only).
 *                     Gemini generates a new lifestyle photo from scratch.
 *
 * Set in .env.local:
 *   GEMINI_API_KEY   — your Google AI Studio API key
 *   GEMINI_MODEL     — optional override (default: gemini-2.5-flash-image)
 */

const DEFAULT_MODEL   = 'gemini-2.5-flash-image'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ── Prompts: model-based compositing ──────────────────────────────────────────
// Image 1 = model photo, Image 2 = jewelry product photo

const MODEL_COMPOSITE_PROMPTS: Record<string, string> = {
  rings:
    'You are a professional jewelry photographer and digital retoucher. ' +
    'The first image is a fashion model photo. The second image is a jewelry product photo showing a ring. ' +
    'Task: Add this exact ring naturally to the model\'s finger(s) in the first image. ' +
    'Keep the model\'s pose, face, hair, skin tone, and clothing EXACTLY as shown — do not alter them in any way. ' +
    'Place the ring on an appropriate finger so it looks naturally worn. ' +
    'Preserve the ring design exactly — do not alter shape, stones, metal, or finish. ' +
    'Match the jewelry lighting to the existing photo lighting. ' +
    'Result: a seamless, high-end jewelry editorial photo, 8k resolution, sharp focus.',

  necklaces:
    'You are a professional jewelry photographer and digital retoucher. ' +
    'The first image is a fashion model photo. The second image is a jewelry product photo showing a necklace. ' +
    'Task: Add this exact necklace to the model\'s neck and collarbone area in the first image. ' +
    'Keep the model\'s pose, face, hair, skin tone, and clothing EXACTLY as shown — do not alter them in any way. ' +
    'The necklace must drape naturally around the neck and over the collarbone. ' +
    'Preserve the necklace design exactly — do not alter pendants, chain, stones, or finish. ' +
    'Match the jewelry lighting to the existing photo lighting. ' +
    'Result: a seamless, high-end jewelry editorial photo, 8k resolution, sharp focus.',

  earrings:
    'You are a professional jewelry photographer and digital retoucher. ' +
    'The first image is a fashion model photo. The second image is a jewelry product photo showing earrings. ' +
    'Task: Add these exact earrings to the model\'s ear(s) in the first image. ' +
    'Keep the model\'s pose, face, hair, skin tone, and clothing EXACTLY as shown — do not alter them in any way. ' +
    'Position the earrings naturally on the earlobe(s) as if worn. ' +
    'Preserve the earring design exactly — do not alter shape, stones, metal, or finish. ' +
    'Match the jewelry lighting to the existing photo lighting. ' +
    'Result: a seamless, high-end jewelry editorial photo, 8k resolution, sharp focus.',

  bracelets:
    'You are a professional jewelry photographer and digital retoucher. ' +
    'The first image is a fashion model photo. The second image is a jewelry product photo showing a bracelet. ' +
    'Task: Add this exact bracelet to the model\'s wrist in the first image. ' +
    'Keep the model\'s pose, face, hair, skin tone, and clothing EXACTLY as shown — do not alter them in any way. ' +
    'Place the bracelet naturally on the wrist as if worn. ' +
    'Preserve the bracelet design exactly — do not alter shape, stones, metal, or finish. ' +
    'Match the jewelry lighting to the existing photo lighting. ' +
    'Result: a seamless, high-end jewelry editorial photo, 8k resolution, sharp focus.',

  universal:
    'You are a professional jewelry photographer and digital retoucher. ' +
    'The first image is a fashion model photo. The second image is a jewelry product photo. ' +
    'Task: Add this exact jewelry piece to the appropriate body part of the model in the first image. ' +
    'Keep the model\'s pose, face, hair, skin tone, and clothing EXACTLY as shown — do not alter them in any way. ' +
    'Position the jewelry naturally so it looks elegantly worn. ' +
    'Preserve the jewelry design exactly — do not alter shape, stones, metal, or finish. ' +
    'Match the jewelry lighting to the existing photo lighting. ' +
    'Result: a seamless, high-end jewelry editorial photo, 8k resolution, sharp focus.',
}

// ── Prompts: standalone generation (no model photo) ───────────────────────────

const STANDALONE_PROMPTS: Record<string, string> = {
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
  /** Signed URL to the uploaded jewelry photo */
  imageUrl:          string
  /** Jewelry category: rings | necklaces | earrings | bracelets | universal */
  templateCategory:  string
  /** Optional model reference photo — enables compositing mode */
  modelImageBuffer?: Buffer
  /** MIME type of modelImageBuffer */
  modelMimeType?:    string
}

export interface GenerationResult {
  imageBuffer:  Buffer
  mimeType:     string
  predictionId: string
}

// ── Gemini API response types ─────────────────────────────────────────────────

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
 * Generates a jewelry lifestyle photo via Gemini.
 *
 * If modelImageBuffer is provided (model-based mode):
 *   Sends model photo + jewelry photo → Gemini composites jewelry onto the model.
 *
 * Otherwise (standalone mode):
 *   Sends jewelry photo alone → Gemini generates a new lifestyle scene from scratch.
 *
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

  // ── 1. Download jewelry image ──────────────────────────────────────────────
  const imageRes = await fetch(params.imageUrl, {
    signal: AbortSignal.timeout(30_000),
  })
  if (!imageRes.ok) {
    throw new Error('Не удалось загрузить исходное изображение для обработки.')
  }

  const jewelryBuffer   = Buffer.from(await imageRes.arrayBuffer())
  const jewelryMimeType = imageRes.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
  const jewelryBase64   = jewelryBuffer.toString('base64')

  // ── 2. Build request parts ─────────────────────────────────────────────────
  let parts: object[]
  let prompt: string

  if (params.modelImageBuffer && params.modelMimeType) {
    // Model-based compositing: send model photo first, then jewelry photo
    const modelBase64 = params.modelImageBuffer.toString('base64')
    prompt = MODEL_COMPOSITE_PROMPTS[params.templateCategory] ?? MODEL_COMPOSITE_PROMPTS.universal
    parts = [
      { inlineData: { mimeType: params.modelMimeType, data: modelBase64 } },
      { inlineData: { mimeType: jewelryMimeType,      data: jewelryBase64 } },
      { text: prompt },
    ]
  } else {
    // Standalone: jewelry photo only
    prompt = STANDALONE_PROMPTS[params.templateCategory] ?? STANDALONE_PROMPTS.universal
    parts = [
      { inlineData: { mimeType: jewelryMimeType, data: jewelryBase64 } },
      { text: prompt },
    ]
  }

  // ── 3. Call Gemini ─────────────────────────────────────────────────────────
  const body = JSON.stringify({
    contents: [{ parts }],
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
      signal:  AbortSignal.timeout(90_000),
    }
  )

  const data = (await res.json()) as GeminiResponse

  if (!res.ok) {
    console.error('Gemini API error:', data.error)
    throw new Error(
      data.error?.message ?? 'Ошибка при генерации изображения. Попробуйте снова.'
    )
  }

  // ── 4. Extract image from response ─────────────────────────────────────────
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData) {
    console.error('Gemini returned no image part:', JSON.stringify(data).slice(0, 500))
    throw new Error(
      'Модель не вернула изображение. Попробуйте другой шаблон или загрузите другое фото.'
    )
  }

  return {
    imageBuffer:  Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType:     imagePart.inlineData.mimeType,
    predictionId: `gemini-${Date.now()}`,
  }
}
