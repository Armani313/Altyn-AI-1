#!/usr/bin/env node
/**
 * One-off script: generate 9:16 thumbnail photos for clothing/mannequin templates
 * using Gemini 3.1 Flash Image (Nano Banana 2). Saves PNGs to public/models/.
 *
 * Usage:
 *   node scripts/generate-mannequin-thumbnails.mjs              # all 22 templates
 *   node scripts/generate-mannequin-thumbnails.mjs 24 25 26     # specific IDs
 *   DRY_RUN=1 node scripts/generate-mannequin-thumbnails.mjs    # print prompts only
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const MODELS_DIR = resolve(ROOT, 'public/models')

// ── Load .env.local (simple parser) ──────────────────────────────────────────
const envPath = resolve(ROOT, '.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) {
      let value = m[2]
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[m[1]] = value
    }
  }
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-3.1-flash-image-preview'
const API_BASE       = 'https://generativelanguage.googleapis.com/v1beta/models'

if (!GEMINI_API_KEY && !process.env.DRY_RUN) {
  console.error('❌ GEMINI_API_KEY not found in env or .env.local')
  process.exit(1)
}

// ── Template definitions (mirrors lib/constants.ts models 19-40) ────────────
const TEMPLATES = [
  // Visible male mannequins
  { num: 19, name: 'Полноростовый мужской манекен',
    prompt: 'Professional e-commerce product photography thumbnail, 9:16 vertical composition. Subject: full-body adult male retail mannequin wearing a dark grey business suit with white shirt and tie, standing frontal pose, clean white seamless studio background, soft even product lighting, sharp focus on garment structure. Show the full mannequin from head to feet. No text, no watermarks.' },
  { num: 20, name: 'Мужской торс-манекен рубашка',
    prompt: 'Professional e-commerce product photography thumbnail, 9:16 vertical composition. Subject: male torso half-body retail mannequin (no head, cut at waist) wearing a crisp light-blue dress shirt with buttons and collar visible, frontal view, clean white seamless studio background, soft product lighting. No text.' },
  { num: 21, name: 'Мужской торс-манекен куртка',
    prompt: 'Professional e-commerce product photography thumbnail, 9:16 vertical composition. Subject: male torso mannequin at three-quarter angle (no head) wearing a navy blue blazer jacket with lapels visible, clean white seamless studio background, soft directional product lighting. No text.' },
  { num: 22, name: 'Нижний мужской манекен брюки',
    prompt: 'Professional e-commerce product photography thumbnail, 9:16 vertical composition. Subject: lower-body male mannequin legs (from waist down) wearing slim-fit classic dark grey dress trousers, frontal view showing full length of legs, clean white seamless studio background, soft product lighting. No text.' },
  { num: 23, name: 'Мужской манекен casual',
    prompt: 'Professional e-commerce product photography thumbnail, 9:16 vertical composition. Subject: full-body adult male mannequin wearing casual outfit (simple grey t-shirt and dark jeans), relaxed natural standing pose, clean light-grey studio background, modern retail display aesthetic, soft product lighting. No text.' },

  // Ghost mannequin — Men
  { num: 24, name: 'Ghost рубашка мужская',
    prompt: 'Professional e-commerce ghost mannequin (invisible mannequin / hollow-man) product photography thumbnail, 9:16 vertical composition. A men\'s white dress shirt with visible buttons, collar, and sleeves appears to float in 3D shape as if worn by an invisible person. NO mannequin, NO human body, NO face visible. The shirt holds its full form as if someone is wearing it. Clean pure white seamless background, soft even lighting, sharp focus. No text.' },
  { num: 25, name: 'Ghost футболка мужская',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A men\'s navy polo shirt or fitted t-shirt floats in 3D shape as if worn by invisible person, showing collar, sleeves, and shoulder structure. NO mannequin visible, NO human body, NO face. Clean pure white seamless background, soft product lighting. No text.' },
  { num: 26, name: 'Ghost блейзер мужской',
    prompt: 'Professional e-commerce ghost mannequin (invisible mannequin / hollow-man) product photography thumbnail, 9:16 vertical composition. A men\'s charcoal grey blazer sport coat floats in 3D shape as if worn by invisible person, showing lapels, buttons, structured shoulders, and open front. NO mannequin, NO body, NO face visible. Clean pure white seamless background, soft directional lighting. No text.' },
  { num: 27, name: 'Ghost худи мужское',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A men\'s grey pullover hoodie floats in 3D shape as if worn by invisible person, showing hood, kangaroo pocket, drawstrings, and natural fabric drape. NO mannequin, NO body visible. Clean pure white seamless background, soft casual product lighting. No text.' },
  { num: 28, name: 'Ghost брюки мужские',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A pair of men\'s dark blue slim-fit trousers floats in 3D shape as if worn by invisible person, front view, showing waistband, belt loops, crease line, and natural leg drape. NO mannequin, NO body visible. Clean pure white seamless background. No text.' },
  { num: 29, name: 'Ghost пальто мужское',
    prompt: 'Professional e-commerce ghost mannequin (invisible mannequin / hollow-man) product photography thumbnail, 9:16 vertical composition. A men\'s long camel wool overcoat floats in 3D shape as if worn by invisible person, showing collar, lapels, buttons, and full silhouette to below knees. NO mannequin visible. Clean pure white seamless background, luxury product lighting. No text.' },

  // Visible child mannequins
  { num: 30, name: 'Детский манекен casual',
    prompt: 'Professional e-commerce children\'s clothing product photography thumbnail, 9:16 vertical composition. Subject: full-body child retail mannequin (child-proportions, no face features or featureless smooth head) wearing a cheerful casual outfit (bright t-shirt and shorts), standing pose, clean light-cream seamless studio background, soft warm product lighting. No text.' },
  { num: 31, name: 'Детский манекен куртка',
    prompt: 'Professional e-commerce children\'s clothing product photography thumbnail, 9:16 vertical composition. Subject: child torso mannequin (no head, half-body) wearing a zipped bright kids jacket showing collar, zipper, and sleeves, clean light-cream seamless studio background, soft product lighting. No text.' },
  { num: 32, name: 'Детский манекен платье',
    prompt: 'Professional e-commerce children\'s clothing product photography thumbnail, 9:16 vertical composition. Subject: full-body child retail mannequin (featureless smooth head, child proportions) wearing a pretty floral sundress, standing pose, clean light-cream seamless studio background, soft warm product lighting. No text.' },

  // Ghost mannequin — Children
  { num: 33, name: 'Ghost футболка детская',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A small children\'s striped t-shirt floats in 3D shape as if worn by invisible child, showing neck opening, sleeves, and natural fabric form. NO mannequin, NO body, NO face visible. Clean pure white seamless background, soft product lighting. No text.' },
  { num: 34, name: 'Ghost куртка детская',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A small children\'s blue zipped jacket floats in 3D shape as if worn by invisible child, showing zipper, hood or collar, and sleeves. NO mannequin, NO body visible. Clean pure white seamless background. No text.' },
  { num: 35, name: 'Ghost платье детское',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A cute children\'s pink floral dress floats in 3D shape as if worn by invisible child, showing bodice, waistline, and flared skirt with natural volume. NO mannequin, NO body visible. Clean pure white seamless background, soft warm product lighting. No text.' },
  { num: 36, name: 'Ghost штаны детские',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A pair of small children\'s blue denim jeans floats in 3D shape as if worn by invisible child, front view, showing waistband, pockets, and natural leg form. NO mannequin, NO body visible. Clean pure white seamless background. No text.' },
  { num: 37, name: 'Ghost худи детское',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A small children\'s bright yellow hoodie floats in 3D shape as if worn by invisible child, showing hood, kangaroo pocket, and sleeves. NO mannequin, NO body visible. Clean pure white seamless background, soft product lighting. No text.' },

  // Ghost mannequin — Women
  { num: 38, name: 'Ghost блузка женская',
    prompt: 'Professional e-commerce ghost mannequin (invisible mannequin / hollow-man) product photography thumbnail, 9:16 vertical composition. An elegant women\'s silk cream blouse floats in 3D shape as if worn by invisible woman, showing collar, sleeves, neckline, and delicate fabric drape. NO mannequin, NO body, NO face visible. Clean pure white seamless background, soft luxury product lighting. No text.' },
  { num: 39, name: 'Ghost платье женское',
    prompt: 'Professional e-commerce ghost mannequin (invisible mannequin / hollow-man) product photography thumbnail, 9:16 vertical composition. An elegant women\'s black cocktail dress floats in 3D shape as if worn by invisible woman, showing neckline, cinched waistline, and elegant silhouette with natural fabric drape. NO mannequin visible. Clean pure white seamless background, soft luxury fashion lighting. No text.' },
  { num: 40, name: 'Ghost жакет женский',
    prompt: 'Professional e-commerce ghost mannequin invisible-mannequin product photography thumbnail, 9:16 vertical composition. A women\'s tailored blazer jacket floats in 3D shape as if worn by invisible woman, showing structured shoulders, lapels, buttons, and open front. NO mannequin, NO body visible. Clean pure white seamless background, soft product lighting. No text.' },
]

// ── Args parsing ─────────────────────────────────────────────────────────────
const requestedNums = process.argv.slice(2)
  .map(Number)
  .filter((n) => Number.isInteger(n) && n >= 19 && n <= 40)

const selected = requestedNums.length > 0
  ? TEMPLATES.filter((t) => requestedNums.includes(t.num))
  : TEMPLATES

console.log(`\n🎨 Generating ${selected.length} mannequin thumbnails via ${GEMINI_MODEL}\n`)

// ── Generation loop ──────────────────────────────────────────────────────────
const TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 120_000
const MAX_RETRIES = Number(process.env.GEMINI_RETRIES) || 3

async function generateOne(tpl, outPath) {
  let lastErr = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body = JSON.stringify({
        contents: [{ parts: [{ text: tpl.prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '9:16' },
        },
      })

      const res = await fetch(
        `${API_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal:  AbortSignal.timeout(TIMEOUT_MS),
        }
      )

      if (!res.ok) {
        const errText = await res.text()
        lastErr = new Error(`HTTP ${res.status}: ${errText.slice(0, 160)}`)
        // 4xx are permanent (bad request, quota, auth) — don't retry
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw lastErr
        }
      } else {
        const data = await res.json()
        const parts = data.candidates?.[0]?.content?.parts ?? []
        const imagePart = parts.find((p) => p.inlineData?.data)
        if (!imagePart) {
          lastErr = new Error('no image in response')
        } else {
          const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
          writeFileSync(outPath, buffer)
          return { ok: true, bytes: buffer.length, attempts: attempt }
        }
      }
    } catch (err) {
      lastErr = err
    }

    if (attempt < MAX_RETRIES) {
      const backoff = 2000 * attempt   // 2s, 4s
      await new Promise((r) => setTimeout(r, backoff))
    }
  }
  return { ok: false, error: lastErr?.message || 'unknown' }
}

let success = 0
let failed  = 0
const failedList = []

for (const tpl of selected) {
  const outPath = resolve(MODELS_DIR, `${tpl.num}.png`)
  process.stdout.write(`  [${tpl.num}] ${tpl.name}... `)

  if (process.env.DRY_RUN) {
    console.log('DRY_RUN')
    console.log(`       → ${tpl.prompt.slice(0, 120)}...`)
    continue
  }

  const result = await generateOne(tpl, outPath)
  if (result.ok) {
    const kb = (result.bytes / 1024).toFixed(0)
    const retryNote = result.attempts > 1 ? ` (attempt ${result.attempts})` : ''
    console.log(`✅ ${kb} KB → ${tpl.num}.png${retryNote}`)
    success++
    // Rate-limit: project uses 80 RPM cap; be conservative
    await new Promise((r) => setTimeout(r, 1500))
  } else {
    console.log(`❌ ${result.error}`)
    failed++
    failedList.push(tpl.num)
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n✨ Done: ${success} success, ${failed} failed\n`)
if (failedList.length > 0) {
  console.log(`Failed templates: ${failedList.join(' ')}`)
  console.log(`Retry with: node scripts/generate-mannequin-thumbnails.mjs ${failedList.join(' ')}\n`)
  process.exit(1)
}
