/**
 * contact-sheet.ts
 *
 * Prompt builder for 2×2 Contact Sheet generation via Gemini.
 *
 * One Gemini call → one 2K image → split into 4 × ~1K panels (via sharp).
 * Panel numbering:
 *   ┌───────────┬───────────┐
 *   │  1 (TL)   │  2 (TR)   │
 *   ├───────────┼───────────┤
 *   │  3 (BL)   │  4 (BR)   │
 *   └───────────┴───────────┘
 */

import type { ProductType } from '@/lib/constants'
import { buildUserPromptSuffix } from '@/lib/ai/moderation'

// ── Panel metadata ────────────────────────────────────────────────────────────

/** Russian label shown in the UI for each panel position */
export const PANEL_NAMES_RU: Record<1 | 2 | 3 | 4, string> = {
  1: 'Лайфстайл',
  2: 'Детали',
  3: 'Флет-лей',
  4: 'Сцена',
}

// ── Quadrant descriptions per product type ────────────────────────────────────

interface Quadrants {
  topLeft:     string
  topRight:    string
  bottomLeft:  string
  bottomRight: string
}

const JEWELRY: Quadrants = {
  topLeft:     'classic lifestyle shot, jewelry worn on a female model, soft cream studio background, shoulder-up framing',
  topRight:    'extreme macro close-up of the jewelry on pure white background, showcasing stones, metal texture, and craftsmanship details, shallow depth of field',
  bottomLeft:  'elegant flat-lay arrangement of the jewelry on white marble or cream velvet, overhead view, even soft natural light',
  bottomRight: 'styled editorial scene with the jewelry displayed beside luxury props (flower petals, silk fabric, perfume bottle), warm atmospheric lighting',
}

const SCARVES: Quadrants = {
  topLeft:     'scarf draped elegantly over the shoulders of a female model, soft studio light, neutral background',
  topRight:    'flat-lay top-down view of the scarf fully unfolded, showing complete pattern and texture, white marble surface, even light',
  bottomLeft:  'scarf artfully folded or knotted, close-up of texture and print details, luxurious surface',
  bottomRight: 'scarf tied as a headscarf on a female model, showing knot style and pattern, warm natural light',
}

const WATCHES: Quadrants = {
  topLeft:     'watch or bracelet worn on a female wrist, face prominently visible, cream background, soft directional studio light',
  topRight:    'extreme macro close-up of the dial, clasp, or bracelet links, showing fine detail and material texture, black or white background',
  bottomLeft:  'flat-lay on marble or velvet surface, overhead view, even soft light revealing proportions',
  bottomRight: 'styled editorial scene with the watch or bracelet beside luxury props (leather wallet, sunglasses), warm atmospheric light',
}

const BAGS: Quadrants = {
  topLeft:     'bag carried by a stylish female model, natural pose, soft studio light, neutral background',
  topRight:    'macro close-up of the bag\'s hardware, clasp, stitching, and material texture, white background',
  bottomLeft:  'bag open or posed on marble or velvet surface, overhead flat-lay perspective, even natural light',
  bottomRight: 'bag placed in a chic lifestyle environment (cafe table, windowsill, luxury surface), warm atmospheric light',
}

const HEADWEAR: Quadrants = {
  topLeft:     'accessory worn by a stylish female model, natural confident pose, soft studio light',
  topRight:    'macro close-up of the accessory showing material, texture, and design details, white background',
  bottomLeft:  'flat-lay of the accessory on marble or velvet surface, overhead view, even light',
  bottomRight: 'accessory in a curated lifestyle setting with complementary props, warm atmospheric light',
}

const OUTERWEAR: Quadrants = {
  topLeft:     'garment worn by a female model, full-body front view, elegant pose, neutral studio background',
  topRight:    'extreme close-up of the fabric texture, collar, or signature design detail, showing material quality',
  bottomLeft:  'model wearing the garment at a 3/4 angle, showcasing cut and silhouette, soft natural light',
  bottomRight: 'garment worn in an editorial lifestyle setting, atmospheric lighting',
}

const BOTTOMWEAR: Quadrants = {
  topLeft:     'garment worn by a female model, full-length shot showing silhouette, studio background',
  topRight:    'macro close-up of the fabric, waistband, or hem, showing material quality and texture',
  bottomLeft:  'model at 3/4 angle emphasising the silhouette and length, soft natural light',
  bottomRight: 'garment worn in an editorial lifestyle environment, atmospheric warm light',
}

function getQuadrants(productType: ProductType): Quadrants {
  switch (productType) {
    case 'jewelry':    return JEWELRY
    case 'scarves':    return SCARVES
    case 'watches':    return WATCHES
    case 'bags':       return BAGS
    case 'headwear':   return HEADWEAR
    case 'outerwear':  return OUTERWEAR
    case 'bottomwear': return BOTTOMWEAR
    default:           return JEWELRY
  }
}

// ── Main prompt builder ───────────────────────────────────────────────────────

/**
 * Builds a 2×2 contact-sheet prompt for composite mode (model photo + product photo).
 * The 4 panels show the model wearing/displaying the product in different poses/settings.
 */
export function buildCompositeContactSheetPrompt(
  productType: ProductType,
  userPrompt?: string,
): string {
  const suffix = userPrompt ? buildUserPromptSuffix(userPrompt) : ''

  // Composite quadrant descriptions vary by product type
  const panels = getCompositeQuadrants(productType)

  return (
    'You are a professional fashion and product photographer specializing in editorial compositing.\n\n' +

    'You are given two images:\n' +
    '• Image 1: A FASHION MODEL — study her face features, skin tone, hair color and style, and body type carefully. ' +
    'She will appear in ALL four panels of the contact sheet.\n' +
    '• Image 2: A PRODUCT PHOTO — memorize every detail: design, color, material, finish, and proportions.\n\n' +

    'Generate a 2×2 photographic grid (Contact Sheet) showing this SAME model wearing/displaying the product in 4 different scenes:\n' +
    `  Top-left: ${panels.topLeft}\n` +
    `  Top-right: ${panels.topRight}\n` +
    `  Bottom-left: ${panels.bottomLeft}\n` +
    `  Bottom-right: ${panels.bottomRight}\n\n` +

    'CRITICAL MODEL CONSISTENCY: The same model from Image 1 must appear in all 4 quadrants. ' +
    'Maintain her IDENTICAL face, skin tone, hair color and style across every panel. ' +
    'She may have different poses, expressions, and settings in each quadrant.\n\n' +

    'RULES:\n' +
    '• All 4 quadrants must be exactly equal in size — true 2×2 grid\n' +
    '• Use a thin 4px white separator line between quadrants\n' +
    '• Each quadrant fills its area completely — no empty space\n' +
    '• Product design must be PIXEL-PERFECT identical in every panel\n' +
    '• The model\'s face and appearance must be recognizably the SAME person in all 4 panels\n' +
    '• No text labels or captions on the image\n' +
    '• 8K resolution, luxury editorial photography quality' +
    suffix
  )
}

interface CompositeQuadrants {
  topLeft: string; topRight: string; bottomLeft: string; bottomRight: string
}

function getCompositeQuadrants(productType: ProductType): CompositeQuadrants {
  switch (productType) {
    case 'jewelry':
    case 'watches':
      return {
        topLeft:     'model wearing the jewelry, classic elegant pose, soft warm studio light, cream background',
        topRight:    'close-up detail of the jewelry on the model, emphasizing the product\'s craftsmanship',
        bottomLeft:  'model at a 3/4 angle, lifestyle editorial setting, natural atmospheric light',
        bottomRight: 'model with the jewelry in an outdoor or styled scene, warm golden-hour light',
      }
    case 'scarves':
      return {
        topLeft:     'model wearing the scarf draped over shoulders, front view, elegant studio light',
        topRight:    'model with the scarf tied as headscarf, close-up of styling and pattern',
        bottomLeft:  'model with the scarf in a flowing outdoor setting, natural light',
        bottomRight: 'close-up of the scarf\'s pattern and texture as worn by the model',
      }
    case 'headwear':
      return {
        topLeft:     'model wearing the accessory, front-facing elegant pose, studio light',
        topRight:    'model at a 3/4 angle showcasing the accessory from the side',
        bottomLeft:  'close-up of the accessory on the model, emphasizing design detail',
        bottomRight: 'model wearing the accessory in a lifestyle scene, natural warm light',
      }
    case 'outerwear':
      return {
        topLeft:     'model wearing the garment, full-body front view, studio background',
        topRight:    'model at 3/4 angle, showing the garment\'s cut and silhouette',
        bottomLeft:  'close-up of the garment\'s fabric texture and design details on the model',
        bottomRight: 'model wearing the garment in a lifestyle setting, atmospheric light',
      }
    case 'bottomwear':
      return {
        topLeft:     'model wearing the garment, full-length front view, studio background',
        topRight:    'model at 3/4 angle, emphasizing the garment\'s silhouette and length',
        bottomLeft:  'close-up of the garment\'s waistband or hem detail as worn',
        bottomRight: 'model in a lifestyle editorial setting wearing the garment',
      }
    case 'bags':
      return {
        topLeft:     'model holding or carrying the bag naturally, front view, studio light',
        topRight:    'model at 3/4 angle, showing the bag\'s profile and how it is carried',
        bottomLeft:  'close-up of the bag\'s hardware and material details held by model',
        bottomRight: 'model with the bag in a chic lifestyle setting, warm atmospheric light',
      }
    default:
      return {
        topLeft:     'model with the product, classic elegant pose, soft warm studio light',
        topRight:    'close-up detail of the product on the model',
        bottomLeft:  'model at a 3/4 angle, lifestyle editorial setting',
        bottomRight: 'model with the product in an atmospheric scene, golden-hour light',
      }
  }
}

/**
 * Builds a 2×2 contact-sheet prompt for card-template mode.
 * Two inputs: Image 1 = card template layout, Image 2 = product photo.
 * Produces 4 product card variations that all follow the template layout.
 */
export function buildCardTemplateContactSheetPrompt(
  productName?: string,
  brandName?: string,
  productDescription?: string,
): string {
  const name  = productName?.trim()        || ''
  const brand = brandName?.trim()          || ''
  const desc  = productDescription?.trim() || ''

  const textBlock = [
    brand ? `  • Бренд: "${brand}"` : '',
    name  ? `  • Название товара: "${name}"` : '',
    desc  ? `  • Ключевые преимущества: ${desc}` : '',
  ].filter(Boolean).join('\n')

  return (
    'Ты — эксперт по дизайну карточек товаров для премиальных маркетплейсов (Kaspi, Wildberries, Ozon).\n\n' +

    'Тебе даны ДВА изображения:\n' +
    '• Изображение 1: ФОТО ТОВАРА — товар для размещения в каждой карточке. Изучи внимательно: запомни точную форму, цвет, материал, текстуру, отделку и каждую деталь дизайна.\n' +
    '• Изображение 2: ШАБЛОН КАРТОЧКИ — твой визуальный макет. Он определяет фон, цветовую палитру, компоновку, зоны размещения и настроение.\n\n' +

    'Создай сетку 2×2 (Contact Sheet) с 4 РАЗНЫМИ вариациями карточки товара. ' +
    'Каждая панель должна следовать фону и компоновке шаблона, но показывать товар по-разному:\n' +
    '  Верхний левый:   товар по центру, классический вид спереди, фон и стиль соответствуют шаблону\n' +
    '  Верхний правый:  товар под лёгким углом, акцент на объёме и текстуре материала\n' +
    '  Нижний левый:    крупный план деталей товара, драматичное студийное освещение, качество макро\n' +
    '  Нижний правый:   товар в стилизованной лайфстайл-композиции, соответствующей настроению шаблона\n\n' +

    'Каждая панель ОБЯЗАНА:\n' +
    '  • Содержать ТОЧНЫЙ товар с Изображения 1 — ИДЕНТИЧНЫЕ форма, цвет, материал, текстура и пропорции. НЕ заменяй и НЕ изменяй товар.\n' +
    '  • Воспроизводить точный цвет фона, градиент или текстуру шаблона с Изображения 2\n' +
    '  • Применять профессиональное студийное освещение, дополняющее стиль шаблона\n' +
    '  • Выглядеть как готовая к публикации карточка маркетплейса\n' +
    (textBlock
      ? '  • Содержать следующую информацию о товаре в виде чистого, элегантного текста НА РУССКОМ ЯЗЫКЕ, соответствующего типографике шаблона:\n' +
        textBlock + '\n'
      : ''
    ) +
    '\nПРАВИЛА:\n' +
    '• Все 4 квадранта должны быть строго одинакового размера — настоящая сетка 2×2\n' +
    '• Используй тонкую белую разделительную линию 4px между квадрантами\n' +
    '• Каждый квадрант заполняет свою область полностью — без пустого пространства\n' +
    '• Товар должен быть ПОПИКСЕЛЬНО ИДЕНТИЧЕН во всех 4 панелях\n' +
    '• Фон и компоновка шаблона должны быть точно воспроизведены в каждой панели\n' +
    '• Весь текст в карточках — исключительно на русском языке\n' +
    '• Разрешение: чёткое 4K, без размытия, готово к публикации'
  )
}

/**
 * Builds a 2×2 contact-sheet prompt for free-card mode (no template).
 * Generates 4 different product card layout styles in one image.
 */
export function buildCardFreeContactSheetPrompt(
  productName?: string,
  brandName?: string,
  productDescription?: string,
): string {
  const name  = productName?.trim()        || ''
  const brand = brandName?.trim()          || ''
  const desc  = productDescription?.trim() || ''

  const textBlock = [
    brand ? `  • Бренд: "${brand}"` : '',
    name  ? `  • Название товара: "${name}"` : '',
    desc  ? `  • Ключевые преимущества: ${desc}` : '',
  ].filter(Boolean).join('\n')

  return (
    'Ты — выдающийся креативный директор и дизайнер карточек товаров для маркетплейсов (Kaspi, Wildberries, Ozon).\n\n' +

    'Внимательно изучи фото товара. Запомни точный дизайн, материалы, цвета, текстуры и каждую деталь.\n\n' +

    'Создай сетку 2×2 (Contact Sheet) с 4 АБСОЛЮТНО РАЗНЫМИ стилями карточек — по одному на квадрант:\n\n' +

    '  Верхний левый:   ГЕРОИЧЕСКАЯ ЛЕВИТАЦИЯ — товар динамично парит в воздухе, эффект антигравитационного взрыва, ' +
    'мягкий светящийся градиентный фон, современная высокоэнергетичная эстетика\n\n' +

    '  Верхний правый:  ПРЕМИАЛЬНЫЙ ПЬЕДЕСТАЛ — товар стоит на элегантном геометрическом постаменте (мрамор, акрил или бархат), ' +
    'драматичные студийные прожекторы, чёткие каустические отражения, роскошное светотеневое освещение\n\n' +

    '  Нижний левый:    МАКРО ИНФОГРАФИКА — товар смещён в сторону, экстремальный крупный план текстуры, ' +
    'чистые UI-линии, 2-3 круглых выноски с деталями качества материала, технический редакционный стиль\n\n' +

    '  Нижний правый:   СРЕДОВОЙ ЛАЙФСТАЙЛ — товар в своей естественной премиальной среде ' +
    '(мраморная столешница, деревянный стол, бархатная поверхность), боке естественного света, тёплая уютная атмосфера\n\n' +

    (textBlock
      ? 'Включи следующую информацию о товаре в виде чистой, элегантной типографики НА РУССКОМ ЯЗЫКЕ в каждой карточке:\n' +
        textBlock + '\n\n'
      : ''
    ) +

    'ПРАВИЛА:\n' +
    '• Все 4 квадранта должны быть строго одинакового размера — настоящая сетка 2×2\n' +
    '• Используй тонкую белую разделительную линию 4px между квадрантами\n' +
    '• Каждый квадрант заполняет свою область полностью — без пустого пространства\n' +
    '• Товар должен быть ПОПИКСЕЛЬНО ИДЕНТИЧЕН во всех 4 панелях\n' +
    '• Каждый стиль карточки должен визуально отличаться и быть готов к публикации\n' +
    '• Весь текст в карточках — исключительно на русском языке\n' +
    '• Разрешение: 8K, качество рендера Unreal Engine 5, гиперпроработанные детали'
  )
}

/**
 * Builds a 2×2 contact-sheet prompt for "AI free lifestyle" mode.
 * No model image provided — Gemini autonomously picks the best model,
 * poses, angles, and scenes based on the product type.
 */
export function buildFreeLifestyleContactSheetPrompt(
  productType: ProductType,
  userPrompt?: string,
): string {
  const suffix = userPrompt ? buildUserPromptSuffix(userPrompt) : ''

  const wearable = [
    'jewelry', 'scarves', 'headwear', 'outerwear', 'bottomwear', 'watches', 'bags',
  ].includes(productType)

  return (
    'Ты — профессиональный фотограф и арт-директор, специализирующийся на лайфстайл-съёмке для маркетплейсов Kaspi, Wildberries, Ozon.\n\n' +

    'Внимательно изучи фото товара. Запомни точный дизайн, форму, цвет, материал и каждую деталь.\n\n' +

    'На основе анализа товара САМОСТОЯТЕЛЬНО создай сетку 2×2 (Contact Sheet) с 4 разными лайфстайл-снимками:\n\n' +

    '  Верхний левый:   главный лайфстайл-кадр — выбери наиболее выгодную подачу для этого товара, ' +
    (wearable
      ? 'подбери модель с подходящим типажом, внешностью и стилем, которая максимально выгодно демонстрирует товар\n\n'
      : 'помести товар в наиболее подходящую для него атмосферную среду\n\n'
    ) +

    '  Верхний правый:  другой ракурс или сцена — смени угол, освещение или антураж, ' +
    'чтобы показать товар с другой стороны и подчеркнуть его достоинства\n\n' +

    '  Нижний левый:    детальный или творческий кадр — крупный план ключевой детали, ' +
    'флет-лей или нестандартный ракурс по твоему усмотрению\n\n' +

    '  Нижний правый:   редакционная сцена — атмосферный кадр с контекстом, ' +
    'усиливающим желание купить товар; тёплое или драматичное освещение по настроению\n\n' +

    (wearable
      ? 'Для моделей: выбери внешность (типаж, тон кожи, цвет волос, возраст), ' +
        'которая лучше всего подчёркивает стиль и красоту товара. ' +
        'Модель может меняться в разных квадрантах.\n\n'
      : ''
    ) +

    'ПРАВИЛА:\n' +
    '• Товар ИДЕНТИЧЕН во всех 4 панелях — тот же дизайн, цвет, пропорции\n' +
    '• Все 4 квадранта строго одинакового размера — настоящая сетка 2×2\n' +
    '• Тонкая белая разделительная линия 4px между квадрантами\n' +
    '• Каждый квадрант заполнен полностью — без пустого пространства\n' +
    '• Без текстовых подписей на изображении\n' +
    '• Разрешение 8K, профессиональное освещение, максимальная резкость' +
    suffix
  )
}

/**
 * Builds the strict 2×2 contact-sheet generation prompt per the TZ spec.
 */
export function buildContactSheetPrompt(
  productType: ProductType,
  userPrompt?: string,
): string {
  const q      = getQuadrants(productType)
  const suffix = userPrompt ? buildUserPromptSuffix(userPrompt) : ''

  return (
    'You are a professional fashion and luxury product photographer.\n\n' +

    'Examine the product photo carefully. Memorize its EXACT design: ' +
    'shape, color, material, stones/hardware, finish, and proportions.\n\n' +

    'Generate a 2x2 photographic grid (Contact Sheet). ' +
    'Divide the canvas into 4 equal quadrants:\n' +
    `  Top-left: ${q.topLeft}\n` +
    `  Top-right: ${q.topRight}\n` +
    `  Bottom-left: ${q.bottomLeft}\n` +
    `  Bottom-right: ${q.bottomRight}\n\n` +

    'Maintain strict product consistency across all quadrants — ' +
    'the product must be IDENTICAL in every panel: same design, same colors, ' +
    'same materials, same proportions.\n\n' +

    'RULES:\n' +
    '• All 4 quadrants must be exactly equal in size — true 2×2 grid\n' +
    '• Use a thin 4px white separator line between quadrants\n' +
    '• Each quadrant fills its area completely — no empty space\n' +
    '• No text labels or captions on the image\n' +
    '• Maximum photographic quality, sharp focus, 8K resolution' +
    suffix
  )
}
