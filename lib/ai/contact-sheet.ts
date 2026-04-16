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

import type { ProductType, ModelSubjectType } from '@/lib/constants'
import { buildUserPromptSuffix } from '@/lib/ai/moderation'

// ── Panel metadata ────────────────────────────────────────────────────────────

/** Russian label shown in the UI for each panel position */
export const PANEL_NAMES_RU: Record<1 | 2 | 3 | 4, string> = {
  1: 'Лайфстайл',
  2: 'Детали',
  3: 'Флет-лей',
  4: 'Сцена',
}

export const PANEL_NAMES_EN: Record<1 | 2 | 3 | 4, string> = {
  1: 'Lifestyle',
  2: 'Details',
  3: 'Flat lay',
  4: 'Scene',
}

// ── Quadrant descriptions per product type ────────────────────────────────────

interface Quadrants {
  topLeft:     string
  topRight:    string
  bottomLeft:  string
  bottomRight: string
}

const JEWELRY: Quadrants = {
  topLeft:     'classic lifestyle shot, jewelry worn naturally by the chosen subject, soft cream studio background, elegant close framing',
  topRight:    'extreme macro close-up of the jewelry on pure white background, showcasing stones, metal texture, and craftsmanship details, shallow depth of field',
  bottomLeft:  'elegant flat-lay arrangement of the jewelry on white marble or cream velvet, overhead view, even soft natural light',
  bottomRight: 'styled editorial scene with the jewelry displayed beside luxury props (flower petals, silk fabric, perfume bottle), warm atmospheric lighting',
}

const SCARVES: Quadrants = {
  topLeft:     'scarf draped elegantly over the shoulders of the chosen subject, soft studio light, neutral background',
  topRight:    'flat-lay top-down view of the scarf fully unfolded, showing complete pattern and texture, white marble surface, even light',
  bottomLeft:  'scarf artfully folded or knotted, close-up of texture and print details, luxurious surface',
  bottomRight: 'scarf tied as a headscarf or styled elegantly on the chosen subject, showing knot style and pattern, warm natural light',
}

const WATCHES: Quadrants = {
  topLeft:     'watch or bracelet worn on a wrist or premium display, face prominently visible, cream background, soft directional studio light',
  topRight:    'extreme macro close-up of the dial, clasp, or bracelet links, showing fine detail and material texture, black or white background',
  bottomLeft:  'flat-lay on marble or velvet surface, overhead view, even soft light revealing proportions',
  bottomRight: 'styled editorial scene with the watch or bracelet beside luxury props (leather wallet, sunglasses), warm atmospheric light',
}

const BAGS: Quadrants = {
  topLeft:     'bag carried by a stylish subject, natural pose, soft studio light, neutral background',
  topRight:    'macro close-up of the bag\'s hardware, clasp, stitching, and material texture, white background',
  bottomLeft:  'bag open or posed on marble or velvet surface, overhead flat-lay perspective, even natural light',
  bottomRight: 'bag placed in a chic lifestyle environment (cafe table, windowsill, luxury surface), warm atmospheric light',
}

const HEADWEAR: Quadrants = {
  topLeft:     'accessory worn by a stylish subject, natural confident pose, soft studio light',
  topRight:    'macro close-up of the accessory showing material, texture, and design details, white background',
  bottomLeft:  'flat-lay of the accessory on marble or velvet surface, overhead view, even light',
  bottomRight: 'accessory in a curated lifestyle setting with complementary props, warm atmospheric light',
}

const OUTERWEAR: Quadrants = {
  topLeft:     'garment worn by the chosen subject, full-body front view, elegant pose, neutral studio background',
  topRight:    'extreme close-up of the fabric texture, collar, or signature design detail, showing material quality',
  bottomLeft:  'subject wearing the garment at a 3/4 angle, showcasing cut and silhouette, soft natural light',
  bottomRight: 'garment worn in an editorial lifestyle setting, atmospheric lighting',
}

const BOTTOMWEAR: Quadrants = {
  topLeft:     'garment worn by the chosen subject, full-length shot showing silhouette, studio background',
  topRight:    'macro close-up of the fabric, waistband, or hem, showing material quality and texture',
  bottomLeft:  'subject at 3/4 angle emphasising the silhouette and length, soft natural light',
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
  subjectInstruction?: string,
): string {
  const suffix = userPrompt ? buildUserPromptSuffix(userPrompt) : ''

  // Composite quadrant descriptions vary by product type
  const panels = getCompositeQuadrants(productType)

  return (
    'You are a professional fashion and product photographer specializing in editorial compositing.\n\n' +

    'You are given two images:\n' +
    '• Image 1: A FASHION SUBJECT — study this subject carefully: face features or display form, proportions, styling, and overall presentation. ' +
    'The same subject appears in ALL four panels of the contact sheet.\n' +
    '• Image 2: A PRODUCT PHOTO — memorize every detail: design, color, material, finish, and proportions.\n\n' +

    'Generate a 2×2 photographic grid (Contact Sheet) showing this SAME model wearing/displaying the product in 4 different scenes:\n' +
    `  Top-left: ${panels.topLeft}\n` +
    `  Top-right: ${panels.topRight}\n` +
    `  Bottom-left: ${panels.bottomLeft}\n` +
    `  Bottom-right: ${panels.bottomRight}\n\n` +

    'CRITICAL SUBJECT CONSISTENCY: The same subject from Image 1 must appear in all 4 quadrants. ' +
    'Maintain IDENTICAL face or display form, styling, and overall appearance across every panel. ' +
    'The subject may have different poses, expressions, and settings in each quadrant.' +
    (subjectInstruction || '') +
    '\n\n' +

    'RULES:\n' +
    '• All 4 quadrants must be exactly equal in size — true 2×2 grid\n' +
    '• Use a thin 4px white separator line between quadrants\n' +
    '• Each quadrant fills its area completely — no empty space\n' +
    '• Product design must be PIXEL-PERFECT identical in every panel\n' +
    '• The subject\'s face or display appearance must be recognizably the SAME across all 4 panels\n' +
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
        topLeft:     'subject wearing the jewelry, classic elegant pose, soft warm studio light, cream background',
        topRight:    'close-up detail of the jewelry on the subject, emphasizing the product\'s craftsmanship',
        bottomLeft:  'subject at a 3/4 angle, lifestyle editorial setting, natural atmospheric light',
        bottomRight: 'subject with the jewelry in an outdoor or styled scene, warm golden-hour light',
      }
    case 'scarves':
      return {
        topLeft:     'subject wearing the scarf draped over shoulders, front view, elegant studio light',
        topRight:    'subject with the scarf tied or styled close to the face, close-up of styling and pattern',
        bottomLeft:  'subject with the scarf in a flowing outdoor setting, natural light',
        bottomRight: 'close-up of the scarf\'s pattern and texture as worn by the subject',
      }
    case 'headwear':
      return {
        topLeft:     'subject wearing the accessory, front-facing elegant pose, studio light',
        topRight:    'subject at a 3/4 angle showcasing the accessory from the side',
        bottomLeft:  'close-up of the accessory on the subject, emphasizing design detail',
        bottomRight: 'subject wearing the accessory in a lifestyle scene, natural warm light',
      }
    case 'outerwear':
      return {
        topLeft:     'subject wearing the garment, full-body front view, studio background',
        topRight:    'subject at 3/4 angle, showing the garment\'s cut and silhouette',
        bottomLeft:  'close-up of the garment\'s fabric texture and design details on the subject',
        bottomRight: 'subject wearing the garment in a lifestyle setting, atmospheric light',
      }
    case 'bottomwear':
      return {
        topLeft:     'subject wearing the garment, full-length front view, studio background',
        topRight:    'subject at 3/4 angle, emphasizing the garment\'s silhouette and length',
        bottomLeft:  'close-up of the garment\'s waistband or hem detail as worn',
        bottomRight: 'subject in a lifestyle editorial setting wearing the garment',
      }
    case 'bags':
      return {
        topLeft:     'subject holding or carrying the bag naturally, front view, studio light',
        topRight:    'subject at 3/4 angle, showing the bag\'s profile and how it is carried',
        bottomLeft:  'close-up of the bag\'s hardware and material details held by the subject',
        bottomRight: 'subject with the bag in a chic lifestyle setting, warm atmospheric light',
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
    'Create one 2x2 contact sheet from the product photo. Keep the product exactly the same in all 4 panels: same design, color, material, and proportions.\n\n' +
    'Panels:\n' +
    '1. Hero lifestyle shot with the most attractive presentation for this product.\n' +
    '2. Alternate angle or alternate scene that shows the product differently.\n' +
    '3. Detail shot, close-up, or elegant flat-lay that highlights craftsmanship.\n' +
    '4. Editorial lifestyle scene with stronger atmosphere and purchase appeal.\n\n' +
    (wearable
      ? 'If the product is wearable, choose an appropriate model or mannequin automatically. The subject may vary between panels if it improves the presentation.\n\n'
      : ''
    ) +
    'Rules:\n' +
    '• True 2x2 grid with 4 equal panels\n' +
    '• Thin white divider between panels\n' +
    '• Full-bleed panels, no empty margins\n' +
    '• No text or labels on the image\n' +
    '• Premium marketplace photography, realistic lighting, sharp natural detail' +
    suffix
  )
}

function getPromptOnlyQuadrants(productType: ProductType): Quadrants {
  switch (productType) {
    case 'jewelry':
    case 'watches':
      return {
        topLeft: 'clean hero portrait or display shot with the product clearly visible',
        topRight: 'tighter crop focused on the product and how it sits on the subject or display',
        bottomLeft: 'alternate angle with a clean premium background and product-first framing',
        bottomRight: 'simple editorial scene with soft atmosphere and clear purchase appeal',
      }
    case 'scarves':
      return {
        topLeft: 'clean hero portrait showing the scarf naturally worn',
        topRight: 'closer crop highlighting the pattern, fabric, and drape',
        bottomLeft: 'alternate pose with simple premium styling and product-first framing',
        bottomRight: 'soft editorial scene with clear visibility of the textile',
      }
    case 'headwear':
      return {
        topLeft: 'clean hero portrait with the accessory clearly visible',
        topRight: 'closer crop focused on the accessory details',
        bottomLeft: 'alternate angle with premium styling and clear product visibility',
        bottomRight: 'simple editorial scene with the accessory still easy to inspect',
      }
    case 'outerwear':
      return {
        topLeft: 'clean front-facing hero shot of the garment',
        topRight: 'closer crop focused on fit, collar, texture, or signature detail',
        bottomLeft: 'alternate angle showing silhouette and cut',
        bottomRight: 'simple editorial setting with the garment still fully readable',
      }
    case 'bottomwear':
      return {
        topLeft: 'clean hero shot showing the silhouette and length',
        topRight: 'closer crop focused on waistband, hem, or material detail',
        bottomLeft: 'alternate angle that keeps the garment shape easy to read',
        bottomRight: 'simple editorial scene with product-first styling',
      }
    case 'bags':
      return {
        topLeft: 'clean hero shot with the bag clearly visible',
        topRight: 'closer crop on hardware, material, and construction details',
        bottomLeft: 'alternate carrying angle with product-first framing',
        bottomRight: 'simple editorial scene with the bag still large and readable',
      }
    default:
      return {
        topLeft: 'clean hero product presentation',
        topRight: 'closer crop highlighting the main detail',
        bottomLeft: 'alternate angle with a premium background',
        bottomRight: 'simple editorial scene with strong purchase appeal',
      }
  }
}

function isGhostMannequinHint(promptHint?: string): boolean {
  return !!promptHint && /\bghost mannequin\b|\binvisible mannequin\b|\bhollow man\b/i.test(promptHint)
}

function getPromptOnlySubjectLine(subjectType?: ModelSubjectType, promptHint?: string): string {
  switch (subjectType) {
    case 'men':
      return 'Use one adult male model whenever a live subject is needed.'
    case 'kids':
      return 'Use one child model with respectful, age-appropriate catalog styling whenever a live subject is needed.'
    case 'mannequins':
      if (isGhostMannequinHint(promptHint)) {
        return 'Apply the GHOST MANNEQUIN (invisible mannequin / hollow-man) effect across all panels: the garment must appear to be worn by an invisible person, keeping its full 3D shape, collar, sleeves, and natural fabric drape. Do NOT show any mannequin, human face, hands, or body parts. Background must be clean white or neutral studio.'
      }
      return 'Use one clean mannequin, display bust, or display hand instead of a live person whenever it fits the product.'
    case 'women':
      return 'Use one adult female model whenever a live subject is needed.'
    default:
      return 'Use one consistent subject whenever a person or display form is needed.'
  }
}

export function buildPromptOnlyTemplateContactSheetPrompt(
  productType: ProductType,
  options: {
    subjectType?: ModelSubjectType
    pose?: string
    promptHint?: string
  },
  userPrompt?: string,
): string {
  const q = getPromptOnlyQuadrants(productType)
  const suffix = userPrompt ? buildUserPromptSuffix(userPrompt) : ''
  const poseLine = options.pose ? `Preferred framing: ${options.pose}.` : null
  const hintLine = options.promptHint ? `Template cue: ${options.promptHint}.` : null

  return (
    'Create one clean 2x2 contact sheet from the product photo.\n\n' +
    'Keep the product exactly identical in all 4 panels: same design, same color, same material, and same proportions.\n\n' +
    `${getPromptOnlySubjectLine(options.subjectType, options.promptHint)}\n` +
    (poseLine ? `${poseLine}\n` : '') +
    (hintLine ? `${hintLine}\n` : '') +
    'Keep the same subject or display form across the whole sheet.\n\n' +
    'Panels:\n' +
    `1. ${q.topLeft}.\n` +
    `2. ${q.topRight}.\n` +
    `3. ${q.bottomLeft}.\n` +
    `4. ${q.bottomRight}.\n\n` +
    'Rules:\n' +
    '• True 2x2 grid with 4 equal panels\n' +
    '• Thin white divider between panels\n' +
    '• No text or labels on the image\n' +
    '• Clean premium marketplace style\n' +
    '• Realistic lighting and natural detail' +
    suffix
  )
}

/**
 * Builds the strict 2×2 contact-sheet generation prompt per the TZ spec.
 */
export function buildContactSheetPrompt(
  productType: ProductType,
  userPrompt?: string,
  subjectInstruction?: string,
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
    `  Bottom-right: ${q.bottomRight}\n` +
    (subjectInstruction ? `${subjectInstruction}\n\n` : '\n') +

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
