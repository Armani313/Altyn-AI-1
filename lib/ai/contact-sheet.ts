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
import { buildNoGeneratedTextDirective, buildUserPromptSuffix } from '@/lib/ai/moderation'
import {
  buildCardProductInfoBlock,
  buildCardTextLocalizationDirective,
} from '@/lib/ai/card-text-locale'

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
  const noGeneratedText = buildNoGeneratedTextDirective()

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
    suffix +
    noGeneratedText
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
 * Two inputs: Image 1 = product photo, Image 2 = card template layout.
 * Produces 4 product card variations that all follow the template layout.
 */
export function buildCardTemplateContactSheetPrompt(
  productName?: string,
  brandName?: string,
  productDescription?: string,
  textLocale?: string,
): string {
  const { hasText, block } = buildCardProductInfoBlock(
    productName,
    brandName,
    productDescription,
  )
  const localizationDirective = buildCardTextLocalizationDirective(textLocale)

  return (
    'You are an expert product-card designer for premium marketplaces (Kaspi, Wildberries, Ozon).\n\n' +

    'You are given TWO images:\n' +
    '• Image 1: PRODUCT PHOTO — the exact item that must appear in every panel. Memorize the precise shape, color, material, texture, finish, and every design detail.\n' +
    '• Image 2: CARD TEMPLATE — the visual blueprint that defines the background, palette, layout, text zones, and mood.\n\n' +

    'TEXT AND LOCALIZATION RULES:\n' +
    localizationDirective + '\n\n' +

    'Create a 2x2 contact sheet with 4 different product-card variations. Every panel must follow the template background and layout language, while presenting the product in a slightly different way:\n' +
    '  • Top-left: product centered, clean classic hero view.\n' +
    '  • Top-right: slight angle, more emphasis on volume and material texture.\n' +
    '  • Bottom-left: tighter close-up focused on craftsmanship details and dramatic studio lighting.\n' +
    '  • Bottom-right: more atmospheric lifestyle composition that still matches the template mood.\n\n' +

    'Every panel MUST:\n' +
    '  • Show the exact product from Image 1 with pixel-faithful shape, color, material, texture, and proportions. Never redesign or substitute the item.\n' +
    '  • Reproduce the template background, gradients, textures, decorative shapes, and layout logic from Image 2.\n' +
    '  • Use polished marketplace-ready typography and professional studio lighting.\n' +
    (hasText
      ? '  • Integrate the following seller-provided product information as concise elegant on-card copy:\n' +
        block + '\n' +
        '  • If the translation is too long for a panel, shorten it while preserving meaning and keep the text comfortably inside the template text zones.\n'
      : '  • Keep each panel publication-ready without adding placeholder copy.\n'
    ) +
    '\nRULES:\n' +
    '• True 2x2 grid with 4 equally sized panels\n' +
    '• Thin white 4px divider between panels\n' +
    '• Full-bleed panels with no empty margins\n' +
    '• The product must remain pixel-identical in all 4 panels\n' +
    '• The template background and compositional structure must stay recognizable in every panel\n' +
    '• 4K sharpness, clean edges, no blur, no artifacts, publication-ready'
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
  textLocale?: string,
): string {
  const { hasText, block } = buildCardProductInfoBlock(
    productName,
    brandName,
    productDescription,
  )
  const localizationDirective = buildCardTextLocalizationDirective(textLocale)

  return (
    'You are a world-class creative director and product-card designer for marketplaces (Kaspi, Wildberries, Ozon).\n\n' +

    'Study the product photo carefully. Memorize the exact design, materials, colors, textures, and every detail of the item.\n\n' +

    'TEXT AND LOCALIZATION RULES:\n' +
    localizationDirective + '\n\n' +

    'Create a 2x2 contact sheet with 4 clearly different product-card styles, one per quadrant:\n\n' +

    '  • Top-left: HERO LEVITATION — the product floats dynamically with a modern glowing gradient background and energetic premium presentation.\n\n' +
    '  • Top-right: PREMIUM PEDESTAL — the product rests on an elegant geometric podium with dramatic studio lighting, rich reflections, and a luxury mood.\n\n' +
    '  • Bottom-left: MACRO INFOGRAPHIC — the product is offset with an extreme detail crop, clean UI lines, and 2-3 premium callouts focused on craftsmanship.\n\n' +
    '  • Bottom-right: ENVIRONMENTAL LIFESTYLE — the product appears in a natural premium environment such as marble, wood, or velvet, with warm atmospheric lighting.\n\n' +

    (hasText
      ? 'Integrate the following seller-provided product information as concise elegant typography inside each card:\n' +
        block + '\n' +
        'If the localized version becomes too long, simplify the wording and reduce the type scale so everything stays readable and balanced.\n\n'
      : 'No seller copy was provided. Keep the layouts clean and publication-ready without placeholder text.\n\n'
    ) +

    'RULES:\n' +
    '• True 2x2 grid with 4 equally sized panels\n' +
    '• Thin white 4px divider between panels\n' +
    '• Full-bleed panels with no empty margins\n' +
    '• The product must remain pixel-identical in all 4 panels\n' +
    '• Each card style must feel distinct yet ready for publication\n' +
    '• 8K render quality, hyper-detailed materials, clean typography, no blur, no artifacts'
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
  const noGeneratedText = buildNoGeneratedTextDirective()

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
    suffix +
    noGeneratedText
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
  const noGeneratedText = buildNoGeneratedTextDirective()
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
    suffix +
    noGeneratedText
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
  const noGeneratedText = buildNoGeneratedTextDirective()

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
    suffix +
    noGeneratedText
  )
}
