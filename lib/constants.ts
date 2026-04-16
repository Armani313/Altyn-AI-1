// ── Image upload constraints ──────────────────────────────────────────────────
// Single source of truth — used by upload-zone, /api/upload, /api/generate

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export const MAX_IMAGE_MB    = 10
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024

export const SAFE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const

// ── Model photos (public/models/) ─────────────────────────────────────────────
// Static list — filenames and IDs never come from user input.
// API routes look up files via MODEL_PHOTO_MAP[validatedId].filename.

export type ModelCategory = 'necklaces' | 'earrings' | 'rings' | 'outerwear' | 'bottomwear'
export type ModelSubjectType = 'women' | 'men' | 'kids' | 'mannequins'
export type ModelRenderMode = 'reference-image' | 'prompt-only'

// ── Custom user models (up to 5 per user) ─────────────────────────────────────
export const CUSTOM_MODEL_ID_PREFIX = 'user-custom-' as const
export const MAX_CUSTOM_MODELS = 5

/** Returns true if the model ID belongs to a user-uploaded custom model. */
export function isCustomModelId(id: string): boolean {
  return id.startsWith(CUSTOM_MODEL_ID_PREFIX)
}

/**
 * Extracts the 0-based array index from a custom model ID, e.g. 'user-custom-2' → 2.
 * Returns -1 if the ID is malformed (MED-NEW-6: prevents NaN propagation).
 */
export function getCustomModelIndex(id: string): number {
  const n = parseInt(id.slice(CUSTOM_MODEL_ID_PREFIX.length), 10)
  if (!Number.isInteger(n) || n < 0 || n >= MAX_CUSTOM_MODELS) return -1
  return n
}

/** Builds a custom model ID from a 0-based index, e.g. 2 → 'user-custom-2'. */
export function makeCustomModelId(index: number): string {
  return `${CUSTOM_MODEL_ID_PREFIX}${index}`
}

// ── Product types ─────────────────────────────────────────────────────────────
export type ProductType =
  | 'jewelry'    // украшения (кольца, серьги, колье, браслеты)
  | 'scarves'    // платки, шали, палантины
  | 'headwear'   // головные уборы (очки, аксессуары для волос)
  | 'outerwear'  // верхняя одежда (куртки, пальто, блузы, топы)
  | 'bottomwear' // нижняя одежда (юбки, брюки, шорты)
  | 'watches'    // часы, наручные браслеты, кольца
  | 'bags'       // сумки, клатчи

export const VALID_PRODUCT_TYPES = new Set<ProductType>([
  'jewelry', 'scarves', 'headwear', 'outerwear', 'bottomwear', 'watches', 'bags',
])

export interface ModelPhoto {
  id:        string
  filename:  string
  name:      string
  category:  ModelCategory
  subjectType: ModelSubjectType
  pose:      string
  promptHint?: string
  renderMode?: ModelRenderMode
  label?:    string
  premium?:  boolean
}

export const MODEL_PHOTOS: ModelPhoto[] = [
  {
    id: 'model-1',
    filename: '1.jpeg',
    name: 'Элегантное декольте',
    category: 'necklaces',
    subjectType: 'women',
    pose: 'Мягкий фронтальный ракурс',
    label: 'Хит',
  },
  {
    id: 'model-2',
    filename: '2.png',
    name: 'Классический профиль',
    category: 'earrings',
    subjectType: 'women',
    pose: 'Профиль',
  },
  {
    id: 'model-3',
    filename: '3.jpeg',
    name: 'Нежный жест',
    category: 'earrings',
    subjectType: 'women',
    pose: 'Лёгкий поворот головы',
    label: 'Новый',
  },
  {
    id: 'model-4',
    filename: '4.jpeg',
    name: 'Тёплая улыбка',
    category: 'earrings',
    subjectType: 'women',
    pose: 'Живой портрет',
  },
  {
    id: 'model-5',
    filename: '5.jpeg',
    name: 'Деловой стиль',
    category: 'rings',
    subjectType: 'women',
    pose: 'Акцент на кисти',
  },
  {
    id: 'model-6',
    filename: '6.png',
    name: 'Драматика',
    category: 'rings',
    subjectType: 'women',
    pose: 'Контрастный editorial',
    premium: true,
  },
  {
    id: 'model-7',
    filename: '7.jpeg',
    name: 'Праздничный вечер',
    category: 'necklaces',
    subjectType: 'women',
    pose: 'Вечерний портрет',
  },
  {
    id: 'model-8',
    filename: '8.png',
    name: 'Гламур',
    category: 'earrings',
    subjectType: 'women',
    pose: 'Бьюти-ракурс',
    premium: true,
  },
  {
    id: 'model-9',
    filename: '9.jpeg',
    name: 'Утончённость',
    category: 'necklaces',
    subjectType: 'women',
    pose: 'Чистый студийный ракурс',
    label: 'Хит',
  },
  {
    id: 'model-10',
    filename: '10.svg',
    name: 'Мужской профиль',
    category: 'necklaces',
    subjectType: 'men',
    pose: 'Профиль и линия шеи',
    promptHint: 'adult male model, elegant side profile, visible neck and collarbone, premium editorial styling',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-11',
    filename: '11.svg',
    name: 'Мужской акцент на руке',
    category: 'rings',
    subjectType: 'men',
    pose: 'Крупный план кисти',
    promptHint: 'adult male model, close-up of masculine hand and fingers, clean studio lighting, product-forward composition',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-12',
    filename: '12.svg',
    name: 'Мужской ракурс 3/4',
    category: 'earrings',
    subjectType: 'men',
    pose: 'Ракурс 3/4',
    promptHint: 'adult male model, three-quarter portrait, visible ear and jawline, sharp premium fashion look',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-13',
    filename: '13.svg',
    name: 'Детский портрет',
    category: 'necklaces',
    subjectType: 'kids',
    pose: 'Фронтальный портрет',
    promptHint: 'child model, age-appropriate studio portrait, soft friendly expression, respectful premium catalog styling',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-14',
    filename: '14.svg',
    name: 'Детский playful',
    category: 'rings',
    subjectType: 'kids',
    pose: 'Лёгкая динамика',
    promptHint: 'child model, playful natural pose, hands visible, age-appropriate editorial styling, soft clean lighting',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-15',
    filename: '15.svg',
    name: 'Детский профиль',
    category: 'earrings',
    subjectType: 'kids',
    pose: 'Мягкий профиль',
    promptHint: 'child model, soft side profile, visible ear, respectful catalog styling, gentle studio light',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-16',
    filename: '16.svg',
    name: 'Манекен-бюст',
    category: 'necklaces',
    subjectType: 'mannequins',
    pose: 'Бюстовая подача',
    promptHint: 'clean studio mannequin bust, premium retail display, no live human features, elegant neutral background',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-17',
    filename: '17.svg',
    name: 'Манекен-рука',
    category: 'rings',
    subjectType: 'mannequins',
    pose: 'Дисплей кисти',
    promptHint: 'clean mannequin hand display, premium studio retail presentation, focus on the product, elegant minimal styling',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-18',
    filename: '18.svg',
    name: 'Манекен-профиль',
    category: 'earrings',
    subjectType: 'mannequins',
    pose: 'Профильный дисплей',
    promptHint: 'studio mannequin head or ear display, premium jewelry retail presentation, minimal clean luxury setup',
    renderMode: 'prompt-only',
  },

  // ── Мужская одежда — Видимый манекен ─────────────────────────────────────
  {
    id: 'model-19',
    filename: '19.png',
    name: 'Манекен полный рост (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Полноростовая подача',
    promptHint: 'full-body male mannequin wearing a suit, clean white studio background, professional retail display, sharp lighting, premium menswear presentation',
    renderMode: 'prompt-only',
    label: 'Новый',
  },
  {
    id: 'model-20',
    filename: '20.png',
    name: 'Манекен торс — рубашка (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Торс фронтально',
    promptHint: 'male torso mannequin displaying a dress shirt, half-body bust form, clean studio background, crisp retail product photography',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-21',
    filename: '21.png',
    name: 'Манекен торс — куртка (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Торс ракурс 3/4',
    promptHint: 'male torso mannequin wearing a jacket or blazer, three-quarter angle, studio lighting, premium menswear display',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-22',
    filename: '22.png',
    name: 'Манекен ноги — брюки (муж)',
    category: 'bottomwear',
    subjectType: 'mannequins',
    pose: 'Нижняя часть',
    promptHint: 'lower-body male mannequin legs displaying trousers or dress pants, clean studio background, retail product photography, full-length leg view',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-23',
    filename: '23.png',
    name: 'Манекен casual (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Динамичная поза',
    promptHint: 'full-body male mannequin in casual outfit, relaxed walking pose, modern retail store display, clean neutral background',
    renderMode: 'prompt-only',
  },

  // ── Мужская одежда — Ghost / Невидимый манекен ───────────────────────────
  {
    id: 'model-24',
    filename: '24.png',
    name: 'Ghost — рубашка (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: men\'s dress shirt appears to float in 3D shape as if worn by an invisible person, no mannequin visible, clean white background, e-commerce product photography, hollow man effect',
    renderMode: 'prompt-only',
    label: 'Ghost',
  },
  {
    id: 'model-25',
    filename: '25.png',
    name: 'Ghost — футболка (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: men\'s polo shirt or t-shirt floating in 3D shape, invisible mannequin, clean white background, professional e-commerce photography, shows garment structure and fit',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-26',
    filename: '26.png',
    name: 'Ghost — блейзер (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: men\'s blazer or sport coat floating in 3D shape, invisible person wearing it, clean white studio background, premium e-commerce product photography, visible lapels and structure',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-27',
    filename: '27.png',
    name: 'Ghost — худи (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: men\'s hoodie or sweatshirt floating in 3D form, invisible mannequin, clean white background, casual streetwear e-commerce photography, natural fabric drape visible',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-28',
    filename: '28.png',
    name: 'Ghost — брюки (муж)',
    category: 'bottomwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: men\'s trousers or dress pants floating in 3D shape, front view, invisible mannequin, clean white background, professional e-commerce photography, visible crease and drape',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-29',
    filename: '29.png',
    name: 'Ghost — пальто (муж)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: men\'s overcoat or trench coat floating in 3D form, invisible mannequin, clean white background, luxury outerwear e-commerce photography, visible collar and silhouette',
    renderMode: 'prompt-only',
  },

  // ── Детская одежда — Видимый манекен ─────────────────────────────────────
  {
    id: 'model-30',
    filename: '30.png',
    name: 'Манекен ребёнок — casual',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Полный рост',
    promptHint: 'full-body child mannequin displaying casual kids outfit, clean studio background, bright cheerful retail presentation, age-appropriate children\'s clothing display',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-31',
    filename: '31.png',
    name: 'Манекен ребёнок — куртка',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Торс ребёнка',
    promptHint: 'child torso mannequin wearing a kids jacket, half-body display form, clean studio background, professional children\'s clothing retail photography',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-32',
    filename: '32.png',
    name: 'Манекен ребёнок — платье',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Полный рост',
    promptHint: 'full-body child mannequin wearing a dress or sundress, clean studio background, soft warm lighting, children\'s fashion retail display',
    renderMode: 'prompt-only',
  },

  // ── Детская одежда — Ghost / Невидимый манекен ───────────────────────────
  {
    id: 'model-33',
    filename: '33.png',
    name: 'Ghost — футболка (дет)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: children\'s t-shirt floating in 3D shape as if worn by an invisible child, no mannequin visible, clean white background, kids e-commerce product photography',
    renderMode: 'prompt-only',
    label: 'Ghost',
  },
  {
    id: 'model-34',
    filename: '34.png',
    name: 'Ghost — куртка (дет)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: children\'s jacket floating in 3D form, invisible mannequin, clean white background, professional kids clothing e-commerce photography, visible zipper and hood structure',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-35',
    filename: '35.png',
    name: 'Ghost — платье (дет)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: children\'s dress floating in 3D shape, invisible mannequin, clean white background, kids fashion e-commerce photography, visible skirt volume and natural drape',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-36',
    filename: '36.png',
    name: 'Ghost — штаны (дет)',
    category: 'bottomwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: children\'s pants or jeans floating in 3D shape, front view, invisible mannequin, clean white background, kids e-commerce photography',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-37',
    filename: '37.png',
    name: 'Ghost — худи (дет)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: children\'s hoodie or sweatshirt floating in 3D form, invisible mannequin, clean white background, kids casual wear e-commerce photography, visible hood and kangaroo pocket',
    renderMode: 'prompt-only',
  },

  // ── Женская одежда — Ghost / Невидимый манекен ───────────────────────────
  {
    id: 'model-38',
    filename: '38.png',
    name: 'Ghost — блузка (жен)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: women\'s blouse floating in 3D shape as if worn by an invisible woman, no mannequin visible, clean white background, premium e-commerce fashion photography, visible collar and drape',
    renderMode: 'prompt-only',
    label: 'Ghost',
  },
  {
    id: 'model-39',
    filename: '39.png',
    name: 'Ghost — платье (жен)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: women\'s dress floating in 3D shape, invisible mannequin, clean white background, luxury fashion e-commerce photography, visible waistline and silhouette, elegant natural fabric drape',
    renderMode: 'prompt-only',
  },
  {
    id: 'model-40',
    filename: '40.png',
    name: 'Ghost — жакет (жен)',
    category: 'outerwear',
    subjectType: 'mannequins',
    pose: 'Невидимый манекен',
    promptHint: 'ghost mannequin effect: women\'s jacket or blazer floating in 3D form, invisible mannequin, clean white background, professional fashion e-commerce photography, structured shoulders and lapels visible',
    renderMode: 'prompt-only',
  },
]

/** Safe lookup: validated model_id → ModelPhoto. Never build paths from raw user input. */
export const MODEL_PHOTO_MAP: Record<string, ModelPhoto> = Object.fromEntries(
  MODEL_PHOTOS.map((m) => [m.id, m])
)

/** Set of valid model IDs — use for allowlist validation in API routes. */
export const VALID_MODEL_IDS = new Set(MODEL_PHOTOS.map((m) => m.id))

// ── Macro shot mode ───────────────────────────────────────────────────────────
/** Special model ID that triggers close-up product photography (no human model). */
export const MACRO_SHOT_ID = 'macro-shot' as const

/** Returns true if the model ID is the macro-shot special mode. */
export function isMacroShotId(id: string): boolean {
  return id === MACRO_SHOT_ID
}

// ── Shared validation patterns ────────────────────────────────────────────────
/** Standard UUID v4 regex — use this in all API routes instead of redefining locally. */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── AI Free Lifestyle mode ────────────────────────────────────────────────────
/** Special model ID: AI autonomously picks model, poses, and scenes for the product. */
export const AI_FREE_LIFESTYLE_ID = 'ai-free-lifestyle' as const

/** Returns true if the model ID is the AI free lifestyle mode. */
export function isAiFreeLifestyleId(id: string): boolean {
  return id === AI_FREE_LIFESTYLE_ID
}
