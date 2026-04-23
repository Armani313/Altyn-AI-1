import type { ProductType } from '@/lib/constants'

const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_TEXT_TIMEOUT_MS = 60_000

export type ProductCopyLocale = 'ru' | 'en'

export interface ProductCopyVariants {
  short: string
  detailed: string
  bullets: string
}

export interface ProductCopyParams {
  imageBuffer: Buffer
  mimeType: string
  productType: ProductType
  locale: ProductCopyLocale
  userPrompt?: string
  productName?: string
  brandName?: string
}

interface GeminiPart {
  text?: string
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
  error?: { message?: string; code?: number }
}

const PRODUCT_LABELS: Record<ProductCopyLocale, Record<ProductType, string>> = {
  ru: {
    jewelry: 'украшения',
    scarves: 'платки, шали или шарфы',
    headwear: 'очки, головные уборы или аксессуары для волос',
    outerwear: 'верхняя одежда',
    bottomwear: 'нижняя одежда',
    watches: 'часы или аксессуары для запястья',
    bags: 'сумки или клатчи',
  },
  en: {
    jewelry: 'jewelry',
    scarves: 'scarves or shawls',
    headwear: 'eyewear, headwear, or hair accessories',
    outerwear: 'upper-body clothing',
    bottomwear: 'lower-body clothing',
    watches: 'watches or wrist accessories',
    bags: 'bags or clutches',
  },
}

export async function generateProductMarketplaceCopy(
  params: ProductCopyParams
): Promise<ProductCopyVariants> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Сервис генерации текста временно недоступен. Обратитесь в поддержку.')
  }

  const model = resolveTextModel()
  const productBase64 = params.imageBuffer.toString('base64')
  const prompt = buildPrompt(params)

  let response: Response
  try {
    response = await fetch(
      `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: params.mimeType, data: productBase64 } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            temperature: 0.45,
            maxOutputTokens: 1800,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(GEMINI_TEXT_TIMEOUT_MS),
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('timeout')) {
      throw new Error('Генерация текста заняла слишком много времени. Попробуйте снова.')
    }
    throw error
  }

  const rawText = await response.text()
  let data: GeminiResponse = {}
  try {
    data = JSON.parse(rawText) as GeminiResponse
  } catch {
    console.error(`[ProductCopy] Gemini non-JSON response (${response.status})`)
    throw new Error(`Ошибка генерации текста (${response.status}). Попробуйте снова.`)
  }

  if (!response.ok) {
    console.error(
      '[ProductCopy] Gemini API error:',
      response.status,
      data.error?.code,
      (data.error?.message ?? '').slice(0, 100)
    )

    if (response.status === 429) {
      throw new Error('Превышен лимит запросов к AI. Подождите 1-2 минуты и попробуйте снова.')
    }
    if (response.status === 500 || response.status === 503) {
      throw new Error('AI сервис временно недоступен. Попробуйте через несколько секунд.')
    }
    throw new Error('Ошибка при генерации текста. Попробуйте снова.')
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new Error('Модель не вернула текст. Попробуйте другое фото.')
  }

  return normalizeVariants(parseVariants(text))
}

function resolveTextModel() {
  const rawModel = (process.env.GEMINI_TEXT_MODEL || DEFAULT_TEXT_MODEL).trim()
  return /^[a-zA-Z0-9._-]+$/.test(rawModel) ? rawModel : DEFAULT_TEXT_MODEL
}

function buildPrompt(params: ProductCopyParams) {
  const localeName = params.locale === 'ru' ? 'Russian' : 'English'
  const productLabel = PRODUCT_LABELS[params.locale][params.productType]
  const optionalFacts = [
    params.brandName ? `Brand: ${params.brandName}` : null,
    params.productName ? `Product name: ${params.productName}` : null,
    params.userPrompt ? `Seller visual/context hint: ${params.userPrompt}` : null,
  ].filter(Boolean).join('\n')

  return (
    'You are an expert e-commerce marketplace copywriter.\n' +
    `Write paste-ready product copy in ${localeName} based on the uploaded product photo.\n` +
    `Product category hint: ${productLabel}.\n` +
    (optionalFacts ? `Seller-provided facts:\n${optionalFacts}\n` : '') +
    '\nReturn ONLY valid JSON with this exact shape:\n' +
    '{\n' +
    '  "short": "A concise marketplace description, 2-4 short lines.",\n' +
    '  "detailed": "A fuller marketplace description with a title, paragraph, and benefits.",\n' +
    '  "bullets": "A paste-ready bullet list with 5-7 product-focused bullets."\n' +
    '}\n\n' +
    'Rules:\n' +
    '• Do not mention AI, generated images, photo editing, models, or lifestyle generation.\n' +
    '• Do not invent brand, exact material, size, country, warranty, waterproofing, hypoallergenic claims, discounts, certificates, or delivery terms.\n' +
    '• If a property is uncertain, use safe wording such as "аккуратный дизайн", "визуально", "подходит для образов" / "clean design", "visually", "works well for looks".\n' +
    '• Keep the tone commercial but not spammy. No emojis. No markdown fences.\n' +
    '• The text must be ready to paste into marketplace product descriptions.'
  )
}

function parseVariants(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI вернул текст в неверном формате. Попробуйте снова.')
    return JSON.parse(match[0])
  }
}

function normalizeVariants(value: unknown): ProductCopyVariants {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('AI вернул текст в неверном формате. Попробуйте снова.')
  }

  const raw = value as Partial<Record<keyof ProductCopyVariants, unknown>>
  const variants = {
    short: normalizeText(raw.short, 900),
    detailed: normalizeText(raw.detailed, 2200),
    bullets: normalizeText(raw.bullets, 1400),
  }

  if (!variants.short || !variants.detailed || !variants.bullets) {
    throw new Error('AI вернул неполный текст. Попробуйте снова.')
  }

  return variants
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
}
