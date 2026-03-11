/**
 * Google Gemini AI Provider
 *
 * Model: gemini-3.1-flash-image-preview (Nano Banana 2)
 * Limits: 100 RPM · 200K TPM · 1K RPD
 *
 * Two modes:
 *   1. Model-based  — two images sent (model photo + product photo).
 *   2. Standalone   — one image sent (product photo only).
 *
 * Set in .env.local:
 *   GEMINI_API_KEY   — your Google AI Studio API key
 *   GEMINI_MODEL     — optional override (default: gemini-3.1-flash-image-preview)
 */

import type { ProductType } from '@/lib/constants'
import { buildUserPromptSuffix } from '@/lib/ai/moderation'

const DEFAULT_MODEL   = 'gemini-3.1-flash-image-preview'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ── Jewelry ───────────────────────────────────────────────────────────────────

const MODEL_COMPOSITE_PROMPT =
  'You are a professional jewelry photographer and digital retoucher specializing ' +
  'in high-end editorial compositing.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — this is your CANVAS. Preserve it exactly: ' +
  'do NOT alter the model\'s pose, face, hair, skin tone, or clothing in any way.\n' +
  '• Image 2: A product photo of jewelry — this is your REFERENCE.\n\n' +

  'STEP 1 — JEWELRY ANALYSIS: Identify every piece of jewelry (ring, earrings, ' +
  'necklace, bracelet, brooch, etc.) and memorize their exact design: shape, stones, ' +
  'metal, finish, chain style, and proportions.\n\n' +

  'STEP 2 — MODEL VISIBILITY ANALYSIS: Determine which body areas are clearly visible:\n' +
  '  • Fingers/hands visible → ring placement possible\n' +
  '  • Ear(s) visible → earring placement possible\n' +
  '  • Neck/décolletage visible → necklace placement possible\n' +
  '  • Wrist(s) visible → bracelet placement possible\n\n' +

  'STEP 3 — SELECTIVE PLACEMENT: Place ONLY jewelry matching visible body areas. ' +
  'NEVER generate body parts not already present in Image 1.\n\n' +

  'STEP 4 — COMPOSITING: Add eligible jewelry with natural positioning, matched lighting, ' +
  'correct shadows and reflections, EXACT design reproduction.\n\n' +

  'Result: seamless high-end jewelry editorial photograph, 8k resolution, sharp focus, ' +
  'luxury fashion photography.'

const STANDALONE_PROMPT =
  'You are a professional jewelry photographer.\n\n' +

  'Examine this product photo and identify every piece of jewelry shown. Memorize ' +
  'their exact design: shape, stones, metal, finish, and proportions.\n\n' +

  'Generate a professional lifestyle photograph showing this exact jewelry being worn:\n' +
  '  • Ring → close-up of a female hand/fingers\n' +
  '  • Earrings → elegant close-up of a female ear\n' +
  '  • Necklace → female neck and décolletage\n' +
  '  • Bracelet → female wrist\n' +
  '  • Set → compose to best showcase all pieces together\n\n' +

  'Style: soft warm studio lighting, cream and ivory background, high-end jewelry ' +
  'editorial, 8k resolution, sharp focus, luxury fashion photography.\n\n' +

  'CRITICAL: Jewelry in output must be IDENTICAL to the reference — do not alter ' +
  'shape, stones, metal color, chain style, or any design detail.'

// ── Scarves ───────────────────────────────────────────────────────────────────

const SCARF_MODEL_COMPOSITE_PROMPT =
  'You are a professional fashion photographer and digital retoucher specializing ' +
  'in luxury textile and accessories editorial work.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — CANVAS. Preserve EXACTLY: do NOT alter ' +
  'the model\'s face, hair, skin tone, pose, or existing clothing.\n' +
  '• Image 2: A product photo of a scarf, shawl, or headscarf — REFERENCE.\n\n' +

  'STEP 1 — TEXTILE ANALYSIS: Memorize exact colors, pattern, print, fabric type ' +
  '(silk, wool, chiffon, etc.), shape, size, fringe or embellishments.\n\n' +

  'STEP 2 — STYLING: Choose the most natural draping based on visible body areas:\n' +
  '  • Shoulders/neck visible → drape as stole or wrap\n' +
  '  • Head visible → tie as elegant headscarf\n\n' +

  'STEP 3 — DRAPING: Add scarf with natural fabric physics, gravity-correct folds, ' +
  'EXACT color/pattern reproduction, correct lighting and shadows.\n\n' +

  'Result: seamless high-end fashion editorial, 8k resolution, luxury fashion photography.'

const SCARF_STANDALONE_PROMPT =
  'You are a professional fashion photographer.\n\n' +

  'Examine this product photo and identify the textile item (headscarf, shawl, ' +
  'pashmina, stole, wrap). Memorize exact colors, pattern, texture, fabric, shape, ' +
  'and decorative details.\n\n' +

  'Generate a professional lifestyle fashion photograph showing this textile worn:\n' +
  '  • Square headscarf → tied as headscarf or draped over shoulders\n' +
  '  • Rectangular stole/pashmina → draped over both shoulders or around neck\n' +
  '  • Large shawl → draped gracefully over shoulders\n\n' +

  'Style: soft warm studio lighting, cream background, high-end fashion editorial, ' +
  '8k resolution, sharp focus, luxury fashion photography.\n\n' +

  'CRITICAL: Textile must be IDENTICAL to reference — preserve exact colors, pattern, ' +
  'texture, and decorative details. Do not alter the design.'

// ── Headwear (очки, аксессуары для волос) ────────────────────────────────────

const HEADWEAR_MODEL_COMPOSITE_PROMPT =
  'You are a professional fashion photographer and digital retoucher specializing ' +
  'in accessories editorial work.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — CANVAS. Preserve EXACTLY: do NOT alter ' +
  'pose, face, hair, skin tone, or existing clothing in any way.\n' +
  '• Image 2: A product photo of a headwear accessory — REFERENCE.\n\n' +

  'STEP 1 — ACCESSORY ANALYSIS: Identify the exact item type:\n' +
  '  • Sunglasses or eyeglasses → memorize exact frame shape, color, lens tint, ' +
  'temple design, bridge width\n' +
  '  • Headband → memorize width, color, material, embellishments\n' +
  '  • Hair clip, barrette, or pin → memorize shape, size, finish\n' +
  '  • Hat or beret → memorize silhouette, material, color\n\n' +

  'STEP 2 — PLACEMENT ANALYSIS: Check Image 1 for visibility:\n' +
  '  • Face and ears clearly visible → glasses placement is possible\n' +
  '  • Hair/top of head visible → headband or hair accessory is possible\n' +
  '  • If the required area is NOT visible → do not force the placement\n\n' +

  'STEP 3 — PLACEMENT: Add the accessory naturally:\n' +
  '  • Glasses → positioned on nose bridge, temples resting on ears, lens tint ' +
  'matching reference exactly\n' +
  '  • Headband → sitting naturally across the forehead/crown, interacting with hair\n' +
  '  • Clip/pin → secured in hair at a natural position\n' +
  '  • Correct perspective, lighting matched to photo, realistic shadows\n\n' +

  'Result: seamless high-end fashion editorial, 8k resolution, sharp focus, ' +
  'luxury fashion photography.'

const HEADWEAR_STANDALONE_PROMPT =
  'You are a professional fashion photographer.\n\n' +

  'Examine this product photo and identify the headwear accessory (sunglasses, ' +
  'eyeglasses, headband, hair clip, hat, etc.). Memorize its exact design: shape, ' +
  'color, material, and every decorative detail.\n\n' +

  'Generate a professional lifestyle fashion photograph:\n' +
  '  • Sunglasses/eyeglasses → worn by a stylish female model, face slightly turned ' +
  'to showcase both frames and lenses\n' +
  '  • Headband → worn in hair of a female model, hair styled naturally\n' +
  '  • Hair clip/barrette → securing hair elegantly on a female model\n' +
  '  • Hat/beret → worn at a fashionable angle\n\n' +

  'Style: soft warm studio lighting, neutral background, high-end fashion editorial, ' +
  '8k resolution, sharp focus.\n\n' +

  'CRITICAL: The accessory in the output must be IDENTICAL to the reference photo.'

// ── Outerwear (верхняя одежда) ────────────────────────────────────────────────

const OUTERWEAR_MODEL_COMPOSITE_PROMPT =
  'You are a professional fashion photographer and digital retoucher specializing ' +
  'in clothing editorial work.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — CANVAS. Preserve the model\'s face, hair, ' +
  'skin tone, and pose EXACTLY. You may replace or add the upper-body garment.\n' +
  '• Image 2: A product photo of an upper-body garment — REFERENCE.\n\n' +

  'STEP 1 — GARMENT ANALYSIS: Identify the exact item (jacket, coat, blazer, blouse, ' +
  'top, shirt, etc.). Memorize:\n' +
  '  • Exact colors and any print or pattern\n' +
  '  • Cut, silhouette, and length\n' +
  '  • Collar, lapels, buttons, pockets, sleeves, and all details\n' +
  '  • Fabric texture (leather, denim, wool, chiffon, etc.)\n\n' +

  'STEP 2 — FITTING: Dress the model in the garment naturally:\n' +
  '  • Correct fit for the model\'s body proportions\n' +
  '  • Natural fabric folds, draping, and gravity-correct creases\n' +
  '  • Sleeves ending at natural wrist position if arms are visible\n\n' +

  'STEP 3 — COMPOSITING: EXACT color and pattern reproduction, realistic fabric ' +
  'texture, matched lighting and shadows, seamless integration.\n\n' +

  'Result: seamless high-end fashion editorial photograph, 8k resolution, sharp focus.'

const OUTERWEAR_STANDALONE_PROMPT =
  'You are a professional fashion photographer.\n\n' +

  'Examine this product photo and identify the upper-body garment (jacket, coat, ' +
  'blazer, blouse, top, shirt, etc.). Memorize exact colors, pattern, cut, fabric ' +
  'texture, and every design detail.\n\n' +

  'Generate a professional lifestyle fashion photograph:\n' +
  '  • Show a stylish female model wearing this exact garment\n' +
  '  • Natural confident pose that best showcases the garment\'s cut and details\n' +
  '  • If the garment has a distinctive print or pattern, choose a pose that ' +
  'displays it prominently\n\n' +

  'Style: soft warm studio or natural light, elegant background, high-end fashion ' +
  'editorial, 8k resolution, sharp focus.\n\n' +

  'CRITICAL: The garment must be IDENTICAL to the reference — preserve exact colors, ' +
  'pattern, cut, and every design detail.'

// ── Bottomwear (нижняя одежда) ────────────────────────────────────────────────

const BOTTOMWEAR_MODEL_COMPOSITE_PROMPT =
  'You are a professional fashion photographer and digital retoucher specializing ' +
  'in clothing editorial work.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — CANVAS. Preserve the model\'s face, hair, ' +
  'skin tone, and pose EXACTLY. You may replace the lower-body garment.\n' +
  '• Image 2: A product photo of a lower-body garment — REFERENCE.\n\n' +

  'STEP 1 — GARMENT ANALYSIS: Identify the exact item (skirt, trousers, pants, ' +
  'shorts, leggings, etc.). Memorize:\n' +
  '  • Exact colors, pattern, and print\n' +
  '  • Silhouette (A-line, straight, wide-leg, mini, midi, maxi, etc.)\n' +
  '  • Waistband, pockets, buttons, zippers, and all details\n' +
  '  • Fabric texture and weight\n\n' +

  'STEP 2 — VISIBILITY CHECK: The model\'s lower body must be visible. If the lower ' +
  'body is not visible in Image 1, generate the complete image showing the full outfit.\n\n' +

  'STEP 3 — FITTING: Dress the model naturally:\n' +
  '  • Correct fit and silhouette for the model\'s proportions\n' +
  '  • Natural fabric folds at waist, hips, knees\n' +
  '  • Hemline at correct length as per the reference\n\n' +

  'STEP 4 — COMPOSITING: EXACT color and pattern reproduction, realistic fabric ' +
  'texture, matched lighting, seamless integration.\n\n' +

  'Result: seamless high-end fashion editorial photograph, 8k resolution, sharp focus.'

const BOTTOMWEAR_STANDALONE_PROMPT =
  'You are a professional fashion photographer.\n\n' +

  'Examine this product photo and identify the lower-body garment (skirt, trousers, ' +
  'pants, shorts, leggings, etc.). Memorize exact colors, pattern, silhouette, ' +
  'fabric, and all design details.\n\n' +

  'Generate a professional lifestyle fashion photograph:\n' +
  '  • Show a stylish female model wearing this exact garment\n' +
  '  • Full-length or 3/4 shot that showcases the garment\'s silhouette and length\n' +
  '  • Natural elegant pose with complementary neutral top\n\n' +

  'Style: soft warm studio or natural light, elegant background, high-end fashion ' +
  'editorial, 8k resolution, sharp focus.\n\n' +

  'CRITICAL: The garment must be IDENTICAL to the reference — preserve exact colors, ' +
  'pattern, silhouette, and every design detail.'

// ── Watches / wrist accessories ───────────────────────────────────────────────

const WATCHES_MODEL_COMPOSITE_PROMPT =
  'You are a professional watch and accessories photographer and digital retoucher ' +
  'specializing in high-end editorial compositing.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — CANVAS. Preserve it exactly: do NOT alter ' +
  'pose, face, hair, skin tone, or clothing in any way.\n' +
  '• Image 2: A product photo of a watch or wrist accessory — REFERENCE.\n\n' +

  'STEP 1 — PRODUCT ANALYSIS: Identify the exact item (watch, wristwatch, cuff ' +
  'bracelet, charm bracelet, ring, etc.). Memorize:\n' +
  '  • Exact design: case shape, dial, strap/bracelet material and color\n' +
  '  • For rings: band style, stone, metal color\n' +
  '  • Every surface detail, finish, and proportion\n\n' +

  'STEP 2 — VISIBILITY CHECK:\n' +
  '  • Wrist(s) visible → watch or bracelet placement possible\n' +
  '  • Fingers/hands visible → ring placement possible\n' +
  '  • NEVER generate body parts not present in Image 1\n\n' +

  'STEP 3 — PLACEMENT: Add the accessory naturally:\n' +
  '  • Watch/bracelet → on the wrist, correct orientation, clasp on underside\n' +
  '  • Ring → on the appropriate finger, correct perspective\n' +
  '  • Matched lighting, reflections on metal/glass, realistic shadows\n' +
  '  • EXACT reproduction of all design details\n\n' +

  'Result: seamless high-end editorial photograph, 8k resolution, sharp focus, ' +
  'luxury watch/accessories photography.'

const WATCHES_STANDALONE_PROMPT =
  'You are a professional watch and accessories photographer.\n\n' +

  'Examine this product photo and identify the item (wristwatch, bracelet, cuff, ' +
  'ring, etc.). Memorize exact design: dial, case, strap, metal finish, stones, ' +
  'and every detail.\n\n' +

  'Generate a professional lifestyle photograph:\n' +
  '  • Watch/bracelet → elegant close-up on a female wrist, watch face prominently ' +
  'visible, natural hand/wrist pose\n' +
  '  • Ring → graceful close-up of a female hand/fingers wearing the ring\n' +
  '  • Cuff bracelet → wrist shown at a flattering angle\n\n' +

  'Style: soft warm studio lighting, clean neutral background, high-end luxury ' +
  'editorial, 8k resolution, sharp focus, professional watch/jewelry photography.\n\n' +

  'CRITICAL: The accessory in the output must be IDENTICAL to the reference — ' +
  'preserve every design detail, finish, and proportion.'

// ── Bags / clutches ───────────────────────────────────────────────────────────

const BAGS_MODEL_COMPOSITE_PROMPT =
  'You are a professional fashion photographer and digital retoucher specializing ' +
  'in luxury bag and accessories editorial work.\n\n' +

  'You are given two images:\n' +
  '• Image 1: A fashion model photo — CANVAS. Preserve it exactly: do NOT alter ' +
  'pose, face, hair, skin tone, or clothing in any way.\n' +
  '• Image 2: A product photo of a bag or clutch — REFERENCE.\n\n' +

  'STEP 1 — BAG ANALYSIS: Identify the exact bag type (clutch, handbag, shoulder ' +
  'bag, tote, crossbody, etc.). Memorize:\n' +
  '  • Exact shape, dimensions, and silhouette\n' +
  '  • Color, material (leather, suede, fabric), and texture\n' +
  '  • Hardware: clasps, chains, handles, zippers\n' +
  '  • Any logo, pattern, or embellishment\n\n' +

  'STEP 2 — NATURAL PLACEMENT based on bag type and model pose:\n' +
  '  • Clutch → held in one hand at waist or side\n' +
  '  • Handbag with handle → held in hand or at elbow crease\n' +
  '  • Shoulder bag → hanging from shoulder strap\n' +
  '  • Do NOT obscure the model\'s face or significantly alter her pose\n\n' +

  'STEP 3 — COMPOSITING: EXACT color, material, and detail reproduction. ' +
  'Realistic weight and gravity in how the bag hangs or is held. ' +
  'Matched lighting and shadows.\n\n' +

  'Result: seamless high-end fashion editorial photograph, 8k resolution, sharp focus.'

const BAGS_STANDALONE_PROMPT =
  'You are a professional fashion and product photographer.\n\n' +

  'Examine this product photo and identify the bag type (clutch, handbag, shoulder ' +
  'bag, tote, crossbody, etc.). Memorize exact shape, color, material, hardware, ' +
  'and every design detail.\n\n' +

  'Generate a professional lifestyle photograph:\n' +
  '  • Clutch → held elegantly in a female hand against a stylish background, or ' +
  'placed on a luxurious surface (marble, velvet, etc.)\n' +
  '  • Handbag/shoulder bag → carried by a stylish female model or placed on a ' +
  'pedestal/surface in a fashion setting\n' +
  '  • Showcase the bag\'s shape, hardware, and texture prominently\n\n' +

  'Style: soft warm lighting, elegant luxury background, high-end fashion editorial, ' +
  '8k resolution, sharp focus.\n\n' +

  'CRITICAL: The bag in the output must be IDENTICAL to the reference — preserve ' +
  'exact shape, color, material, hardware, and every design detail.'

// ── Macro / close-up product photography ─────────────────────────────────────

const MACRO_PROMPT =
  'You are a professional macro and luxury product photographer.\n\n' +

  'Examine this product photo carefully. Identify the exact item — its type, ' +
  'materials, colors, textures, and every fine detail.\n\n' +

  'Generate a stunning macro close-up product photograph:\n' +
  '  • Extreme close-up that reveals the finest craftsmanship details: texture, ' +
  'surface finish, stones, stitching, hardware, or material quality\n' +
  '  • Tack-sharp focus on the most visually compelling element\n' +
  '  • Soft, directional studio lighting (one main light + fill) that enhances ' +
  'form, depth, and material texture — minimal harsh shadows\n' +
  '  • Clean, neutral background: pure white, off-white, or soft cream gradient\n' +
  '  • Natural surface reflection or subtle shadow beneath the object for depth\n' +
  '  • Composition: product centered or rule-of-thirds, slight angle if it reveals ' +
  'more detail, never flat-lay unless it is a flat textile\n\n' +

  'Style: 8k resolution, macro lens look (shallow depth of field), luxury product ' +
  'catalogue photography, magazine-quality editorial.\n\n' +

  'CRITICAL: The product in the output must be IDENTICAL to the reference — ' +
  'preserve every color, material, proportion, and design detail. Do NOT add ' +
  'any props, flowers, or decorative elements unless they were in the original photo.'

// ── Free card generation ──────────────────────────────────────────────────────

export function buildCardFreePrompt(
  productName?: string,
  brandName?: string,
  productDescription?: string,
): string {
  const name  = productName?.trim()        || ''
  const brand = brandName?.trim()          || ''
  const desc  = productDescription?.trim() || ''

  const hasText = !!(name || brand || desc)

  // Build the raw info block for Phase 3
  const rawInfoLines: string[] = []
  if (brand) rawInfoLines.push(`Brand: "${brand}"`)
  if (name)  rawInfoLines.push(`Product name: "${name}"`)
  if (desc)  rawInfoLines.push(`Description: "${desc}"`)

  const rawInfoBlock = rawInfoLines.map(l => `    ${l}`).join('\n')

  return (
    'You are a world-class creative director, 3D product visualizer, and e-commerce conversion expert.\n' +
    'Think through every phase SILENTLY — output ONLY the final product card image.\n\n' +

    // ── PHASE 1 ───────────────────────────────────────────────────────────────
    '── PHASE 1 — UNIVERSAL PRODUCT ANALYSIS\n' +
    'Study every pixel of the reference photo:\n' +
    '  • Category: Identify the exact niche (e.g., Electronics, Fashion, Beauty, Food/Beverage, Industrial, Home Goods, Jewelry).\n' +
    '  • Materials & Textures: Identify key physical traits (matte plastic, glossy glass, organic wood/straw, soft silicone, liquid, metallic, woven fabric).\n' +
    '  • Brand Vibe: Determine the core aesthetic (Eco-friendly/Organic, High-Tech/Futuristic, Luxury/Premium, Playful/Vibrant, Everyday/Utility).\n' +
    '  • Color Story: Extract the main product color and 1-2 complementary accent colors for the background/UI elements.\n\n' +

    // ── PHASE 2 ───────────────────────────────────────────────────────────────
    '── PHASE 2 — DYNAMIC STAGING & COMPOSITION\n' +
    'Based on Phase 1, silently choose ONE high-converting staging direction:\n\n' +

    '  A. HERO LEVITATION (Dynamic & Modern)\n' +
    '     Layout: Product exploding or floating dynamically in mid-air. Anti-gravity effect.\n' +
    '     Vibe: High energy, modern, eye-catching.\n' +
    '     Elements: Flying droplets, particles, or separated product layers. Soft glowing background gradient.\n' +
    '     → Best for: Sneakers, tech gadgets, beverages, modern cosmetics, sports gear.\n\n' +

    '  B. PREMIUM PEDESTAL (Luxury & Authority)\n' +
    '     Layout: Product resting majestically on a geometric podium (stone, acrylic, or velvet).\n' +
    '     Vibe: Expensive, authoritative, trustworthy.\n' +
    '     Elements: Dramatic studio spotlights (chiaroscuro), sharp caustic reflections, elegant negative space.\n' +
    '     → Best for: Perfume, watches, jewelry, high-end electronics, premium packaging.\n\n' +

    '  C. MACRO INFOGRAPHIC (Detailed & Informative)\n' +
    '     Layout: Product offset to one side, extreme close-up showing texture.\n' +
    '     Vibe: Technical, transparent, high-quality.\n' +
    '     Elements: Clean UI lines, 2-3 glowing circular magnifying "callouts" pointing to specific material details, sharp grid lines.\n' +
    '     → Best for: Apparel, building materials, tools, skincare, tech accessories.\n\n' +

    '  D. ENVIRONMENTAL LIFESTYLE (Warm & Relatable)\n' +
    '     Layout: Product placed in its natural high-end habitat (e.g., a marble kitchen counter, a cozy wooden cafe table, a sleek office desk).\n' +
    '     Vibe: Inviting, practical, aesthetic.\n' +
    '     Elements: Heavy depth of field (blurred background/bokeh), dappled sunlight or natural window light, subtle lifestyle props.\n' +
    '     → Best for: Home goods, coffee/food, bags, daily essentials, organic products.\n\n' +

    // ── PHASE 3 ───────────────────────────────────────────────────────────────
    '── PHASE 3 — MARKETING & TYPOGRAPHY REVIEW\n' +
    (hasText
      ? 'Product information provided by the seller:\n' +
        rawInfoBlock + '\n\n' +
        '  • Distill into 1 punchy Headline and max 3 short, high-impact bullet points.\n' +
        '  • Fix any spelling errors or typos silently.\n' +
        '  • If name contradicts the photo, use the visually accurate term.\n' +
        '  • Typography: bold modern sans-serif for tech/modern goods, elegant serif for luxury/organic.\n' +
        '  • Include a visual "Trust Badge" (minimal vector icon: "100% Quality", "Eco", or "Premium").\n\n'
      : 'No text provided.\n' +
        '  • Focus heavily on visual callouts and macro details.\n' +
        '  • Keep the layout clean and ready for text overlay — no placeholder text.\n\n'
    ) +

    // ── PHASE 4 ───────────────────────────────────────────────────────────────
    '── PHASE 4 — FINAL RENDER EXECUTION\n' +
    'Render the product card using the chosen staging:\n' +
    '  • Lighting is everything: Use rim lighting to separate the product from the background.\n' +
    '    Add soft, realistic global illumination.\n' +
    '  • The product MUST remain identical to the reference photo — do not alter its core design,\n' +
    '    shape, or primary material.\n' +
    '  • The composition must look like a top-tier Amazon A+ / Shopify hero image. Edge-to-edge design.\n' +
    '  • 8K resolution, Unreal Engine 5 render quality, octane render, photorealistic, hyper-detailed.\n\n' +

    'OUTPUT FORMAT: Generate the product card IMAGE directly — output ONLY the image, no text.'
  )
}

// ── Template-based card generation ───────────────────────────────────────────

export function buildCardTemplatePrompt(
  productName?: string,
  brandName?: string,
  productDescription?: string,
): string {
  const name  = productName?.trim()  || ''
  const brand = brandName?.trim()    || ''
  const desc  = productDescription?.trim() || ''

  const textBlock = [
    brand ? `  • Brand: "${brand}"` : '',
    name  ? `  • Product name: "${name}"` : '',
    desc  ? `  • Key selling points: ${desc}` : '',
  ].filter(Boolean).join('\n')

  return (
    'You are an expert e-commerce product card designer for premium marketplaces (Kaspi, Wildberries, Ozon).\n\n' +

    'You are given TWO images:\n' +
    '• Image 1: A CARD TEMPLATE — this is your visual blueprint. It defines the layout, background style, color palette, composition, and overall mood.\n' +
    '• Image 2: A PRODUCT PHOTO — this is the item you must feature on the card.\n\n' +

    'STEP 1 — READ THE TEMPLATE:\n' +
    '  • Identify the exact background (solid color, gradient, texture, pattern — note colors precisely)\n' +
    '  • Note the product placement zone (center, lower-third, left-offset, etc.)\n' +
    '  • Note any decorative elements: shadows, geometric shapes, lines, frames\n' +
    '  • Note text zones: where brand/product name/price/badges are positioned\n' +
    '  • Capture the overall mood: minimalist, luxury, energetic, soft, bold, etc.\n\n' +

    'STEP 2 — ANALYZE THE PRODUCT:\n' +
    '  • Identify the exact product type (ring, necklace, earrings, bracelet, watch, bag, etc.)\n' +
    '  • Memorize every detail: shape, color, material, finish, stone, texture\n' +
    '  • Note the best angle to showcase this specific product\n\n' +

    'STEP 3 — CREATE THE PRODUCT CARD:\n' +
    '  • Recreate the template\'s background, color scheme, and layout EXACTLY\n' +
    '  • Place the product in the same compositional zone as the template\n' +
    '  • Apply professional studio lighting that matches the template\'s light mood\n' +
    '  • Give the product a beautiful, sharp close-up with correct shadows and reflections\n' +
    '  • Reproduce any decorative elements from the template (shapes, lines, gradients)\n' +
    (textBlock
      ? '  • Integrate the following product information as clean, elegant text in the template\'s text zones:\n' +
        textBlock + '\n' +
        '  • Use typography that matches the template\'s visual style\n'
      : ''
    ) +
    '  • Result: a polished, publication-ready product card that looks like the template but features THIS product\n\n' +

    'CRITICAL RULES:\n' +
    '  • The product must be PIXEL-PERFECT identical to Image 2 — preserve every color, material, shape, proportion\n' +
    '  • The background and layout must closely follow Image 1\n' +
    '  • Output must fill the entire canvas — no white borders or empty areas\n' +
    '  • Resolution: sharp, 4K quality, zero blur or artifacts\n' +
    '  • Do NOT add props or decorative objects not present in the template'
  )
}

// ── Prompt lookup maps ────────────────────────────────────────────────────────

const COMPOSITE_PROMPTS: Record<ProductType, string> = {
  jewelry:    MODEL_COMPOSITE_PROMPT,
  scarves:    SCARF_MODEL_COMPOSITE_PROMPT,
  headwear:   HEADWEAR_MODEL_COMPOSITE_PROMPT,
  outerwear:  OUTERWEAR_MODEL_COMPOSITE_PROMPT,
  bottomwear: BOTTOMWEAR_MODEL_COMPOSITE_PROMPT,
  watches:    WATCHES_MODEL_COMPOSITE_PROMPT,
  bags:       BAGS_MODEL_COMPOSITE_PROMPT,
}

const STANDALONE_PROMPTS: Record<ProductType, string> = {
  jewelry:    STANDALONE_PROMPT,
  scarves:    SCARF_STANDALONE_PROMPT,
  headwear:   HEADWEAR_STANDALONE_PROMPT,
  outerwear:  OUTERWEAR_STANDALONE_PROMPT,
  bottomwear: BOTTOMWEAR_STANDALONE_PROMPT,
  watches:    WATCHES_STANDALONE_PROMPT,
  bags:       BAGS_STANDALONE_PROMPT,
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerationParams {
  /** Signed URL to the uploaded product photo */
  imageUrl:          string
  /** Optional model reference photo — enables compositing mode */
  modelImageBuffer?: Buffer
  /** MIME type of modelImageBuffer */
  modelMimeType?:    string
  /** Product type — determines which prompts to use (default: 'jewelry') */
  productType?:      ProductType
  /** Optional sanitized user style hint (already passed through moderation) */
  userPrompt?:       string
  /** When true, generates a macro/close-up product shot instead of lifestyle */
  isMacroShot?:      boolean
  /** When true, generates a full product card without a template */
  isCardFree?:          boolean
  /** Card template image buffer — enables template-based card generation */
  cardTemplateBuffer?:  Buffer
  /** MIME type of cardTemplateBuffer */
  cardTemplateMime?:    string
  /** Product name for card modes */
  cardProductName?:     string
  /** Brand name for card modes */
  cardBrandName?:       string
  /** Product description for card modes */
  cardProductDesc?:     string
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

export async function generateJewelryPhoto(
  params: GenerationParams
): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Сервис генерации временно недоступен. Обратитесь в поддержку.')
  }

  // HIGH-NEW-3: validate model slug to prevent URL injection from env var
  const MODEL_SLUG_REGEX = /^[a-zA-Z0-9._-]+$/
  const rawModel = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim()
  const model    = MODEL_SLUG_REGEX.test(rawModel) ? rawModel : DEFAULT_MODEL
  const productType: ProductType = params.productType ?? 'jewelry'

  // ── 1. Download product image ──────────────────────────────────────────────
  const imageRes = await fetch(params.imageUrl, { signal: AbortSignal.timeout(30_000) })
  if (!imageRes.ok) {
    throw new Error('Не удалось загрузить исходное изображение для обработки.')
  }

  const productBuffer   = Buffer.from(await imageRes.arrayBuffer())
  const productMimeType = imageRes.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
  const productBase64   = productBuffer.toString('base64')

  // ── 2. Build request parts ─────────────────────────────────────────────────
  let parts: object[]

  const promptSuffix = params.userPrompt ? buildUserPromptSuffix(params.userPrompt) : ''

  if (params.cardTemplateBuffer && params.cardTemplateMime) {
    // Template card mode: use the selected card template as layout reference
    const templateBase64 = params.cardTemplateBuffer.toString('base64')
    const cardPrompt = buildCardTemplatePrompt(
      params.cardProductName,
      params.cardBrandName,
      params.cardProductDesc,
    )
    parts = [
      { inlineData: { mimeType: params.cardTemplateMime, data: templateBase64 } },
      { inlineData: { mimeType: productMimeType,         data: productBase64 } },
      { text: cardPrompt + promptSuffix },
    ]
  } else if (params.isCardFree) {
    // Card-free mode: AI creates a full product card from scratch
    const cardPrompt = buildCardFreePrompt(
      params.cardProductName,
      params.cardBrandName,
      params.cardProductDesc,
    )
    parts = [
      { inlineData: { mimeType: productMimeType, data: productBase64 } },
      { text: cardPrompt + promptSuffix },
    ]
  } else if (params.isMacroShot) {
    // Macro mode: standalone close-up product shot, never uses a model image
    parts = [
      { inlineData: { mimeType: productMimeType, data: productBase64 } },
      { text: MACRO_PROMPT + promptSuffix },
    ]
  } else if (params.modelImageBuffer && params.modelMimeType) {
    const modelBase64 = params.modelImageBuffer.toString('base64')
    parts = [
      { inlineData: { mimeType: params.modelMimeType, data: modelBase64 } },
      { inlineData: { mimeType: productMimeType,      data: productBase64 } },
      { text: COMPOSITE_PROMPTS[productType] + promptSuffix },
    ]
  } else {
    parts = [
      { inlineData: { mimeType: productMimeType, data: productBase64 } },
      { text: STANDALONE_PROMPTS[productType] + promptSuffix },
    ]
  }

  // ── 3. Call Gemini ─────────────────────────────────────────────────────────
  // Card modes: IMAGE-only modality prevents the model from dumping text analysis
  // instead of generating the image (long prompt edge case).
  const isCardMode = !!(params.isCardFree || params.cardTemplateBuffer)
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      responseModalities: isCardMode ? ['IMAGE'] : ['IMAGE', 'TEXT'],
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
    console.error(`Gemini non-JSON response (${res.status})`)
    throw new Error(`Ошибка генерации (${res.status}). Попробуйте снова.`)
  }

  if (!res.ok) {
    // HIGH-NEW-2: log full error server-side, throw only a sanitized message
    console.error('Gemini API error:', data.error)
    if (res.status === 429) {
      // Check for daily quota exhaustion vs per-minute rate limit
      const errMsg = (data.error?.message ?? '').toLowerCase()
      if (errMsg.includes('quota') || errMsg.includes('daily')) {
        throw new Error('Дневной лимит AI исчерпан. Попробуйте завтра.')
      }
      throw new Error('Превышен лимит запросов к AI. Подождите 1–2 минуты и попробуйте снова.')
    }
    if (res.status === 503 || res.status === 500) {
      throw new Error('AI сервис временно недоступен. Попробуйте через несколько секунд.')
    }
    throw new Error('Ошибка при генерации изображения. Попробуйте снова.')
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
