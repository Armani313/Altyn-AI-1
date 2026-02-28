/**
 * Google Gemini AI Provider
 *
 * Model: gemini-2.5-flash-image
 *
 * Two modes:
 *   1. Model-based  — two images sent (model photo + jewelry photo).
 *                     Gemini auto-detects the jewelry type and composites
 *                     only the pieces that fit onto visible body parts.
 *   2. Standalone   — one image sent (jewelry photo only).
 *                     Gemini auto-detects the jewelry type and generates
 *                     an appropriate lifestyle scene from scratch.
 *
 * Set in .env.local:
 *   GEMINI_API_KEY   — your Google AI Studio API key
 *   GEMINI_MODEL     — optional override (default: gemini-2.5-flash-image)
 */

const DEFAULT_MODEL   = 'gemini-2.5-flash-image'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ── Prompt: model-based compositing ───────────────────────────────────────────
// Image 1 = model photo (canvas), Image 2 = jewelry product photo (reference)
//
// Key design decisions:
//   • Gemini auto-detects jewelry type(s) from Image 2 — no category hint needed.
//   • Gemini analyzes model body visibility from Image 1 — skips placements that
//     would require inventing body parts not present (e.g. hands not visible →
//     no rings/bracelets generated).
//   • Works correctly for jewelry sets: only the subset matching visible body
//     areas is placed.

const MODEL_COMPOSITE_PROMPT =
  'You are a professional jewelry photographer and digital retoucher specializing ' +
  'in high-end editorial compositing.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — this is your CANVAS. Preserve it exactly: ' +
  'do NOT alter the model\'s pose, face, hair, skin tone, or clothing in any way.\n' +
  '• Image 2: A product photo of jewelry — this is your REFERENCE.\n\n' +

  'Follow these steps:\n\n' +

  'STEP 1 — JEWELRY ANALYSIS: Examine Image 2 and identify every piece of jewelry ' +
  'shown (ring, earrings, necklace, bracelet, brooch, anklet, etc.) and memorize ' +
  'their exact design: shape, stones, metal, finish, chain style, and proportions.\n\n' +

  'STEP 2 — MODEL VISIBILITY ANALYSIS: Examine Image 1 and determine which body ' +
  'areas are clearly visible and physically accessible for jewelry placement:\n' +
  '  • Fingers or hands visible → ring placement possible\n' +
  '  • Ear(s) visible → earring placement possible\n' +
  '  • Neck and/or décolletage visible → necklace placement possible\n' +
  '  • Wrist(s) visible → bracelet placement possible\n\n' +

  'STEP 3 — SELECTIVE PLACEMENT RULES (strictly follow):\n' +
  '  • Place ONLY the jewelry pieces from Image 2 that correspond to body areas ' +
  'confirmed VISIBLE in Step 2.\n' +
  '  • If hands/fingers are NOT visible → skip rings and bracelets entirely.\n' +
  '  • If ears are NOT visible → skip earrings entirely.\n' +
  '  • If neck/chest area is NOT visible → skip necklace entirely.\n' +
  '  • NEVER generate or show a body part that is not already present in Image 1. ' +
  'Do not extend the frame, do not add hands, arms, or any other body part.\n\n' +

  'STEP 4 — COMPOSITING: Add only the eligible jewelry with:\n' +
  '  • Natural, realistic positioning as if the model is genuinely wearing it.\n' +
  '  • Jewelry lighting matched to the existing photo\'s light source and color temperature.\n' +
  '  • Correct shadows, reflections, and skin interaction.\n' +
  '  • EXACT reproduction of the jewelry design — do not alter shape, stones, ' +
  'metal color, chain links, engravings, or any detail.\n' +
  '  • Seamless integration with no visible compositing artifacts.\n\n' +

  'Result: a seamless, high-end jewelry editorial photograph, 8k resolution, ' +
  'sharp focus, luxury fashion photography.'

// ── Prompt: standalone generation (no model photo) ────────────────────────────
// Single image: jewelry product photo only.
// Gemini auto-detects what it is and generates an appropriate lifestyle scene.

const STANDALONE_PROMPT =
  'You are a professional jewelry photographer.\n\n' +

  'Examine this product photo carefully and identify every piece of jewelry shown ' +
  '(ring, earrings, necklace, bracelet, or a set of multiple pieces) and memorize ' +
  'their exact design: shape, stones, metal, finish, and proportions.\n\n' +

  'Based on what you identified, generate a professional lifestyle photograph ' +
  'showing this exact jewelry being elegantly worn:\n' +
  '  • Ring → graceful close-up of a female hand/fingers wearing the ring.\n' +
  '  • Earrings → elegant close-up side-profile of a female ear wearing the earrings.\n' +
  '  • Necklace → female neck and décolletage with the necklace draped naturally.\n' +
  '  • Bracelet → female wrist with the bracelet worn naturally.\n' +
  '  • Set (multiple pieces) → compose the shot to best showcase all pieces ' +
  'together; show only the body parts required by the pieces in the set.\n\n' +

  'Style: soft warm studio lighting, cream and ivory background, high-end jewelry ' +
  'editorial, 8k resolution, sharp focus, luxury fashion photography.\n\n' +

  'CRITICAL: The jewelry in the output must be IDENTICAL to the reference photo — ' +
  'do not alter shape, stone cuts, metal color, chain style, or any design detail. ' +
  'Preserve the exact piece as given.'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerationParams {
  /** Signed URL to the uploaded jewelry photo */
  imageUrl:          string
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
 * Model-based mode (modelImageBuffer provided):
 *   Sends model photo + jewelry photo → Gemini auto-detects jewelry type,
 *   analyzes model body visibility, and places only the pieces that fit.
 *
 * Standalone mode (no modelImageBuffer):
 *   Sends jewelry photo alone → Gemini auto-detects type and generates
 *   an appropriate lifestyle scene from scratch.
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

  const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim()

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

  if (params.modelImageBuffer && params.modelMimeType) {
    // Model-based compositing: model photo first (canvas), then jewelry (reference)
    const modelBase64 = params.modelImageBuffer.toString('base64')
    parts = [
      { inlineData: { mimeType: params.modelMimeType, data: modelBase64 } },
      { inlineData: { mimeType: jewelryMimeType,      data: jewelryBase64 } },
      { text: MODEL_COMPOSITE_PROMPT },
    ]
  } else {
    // Standalone: jewelry photo only
    parts = [
      { inlineData: { mimeType: jewelryMimeType, data: jewelryBase64 } },
      { text: STANDALONE_PROMPT },
    ]
  }

  // ── 3. Call Gemini ─────────────────────────────────────────────────────────
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
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

  const rawText = await res.text()
  let data: GeminiResponse = {}
  try {
    data = JSON.parse(rawText) as GeminiResponse
  } catch {
    console.error(`Gemini non-JSON response (${res.status}):`, rawText.slice(0, 300))
    throw new Error(`Ошибка генерации (${res.status}). Попробуйте снова.`)
  }

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
