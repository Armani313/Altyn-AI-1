/**
 * POST /api/generate/demo
 *
 * Free demo generation — no auth required.
 * Rate limited to 1 request per browser session via httpOnly cookie.
 *
 * Request: multipart/form-data
 *   image             File    — jewelry photo (JPG/PNG/WebP/HEIC, max 10 MB)
 *   template_category string? — 'rings' | 'necklaces' | 'earrings' | 'bracelets'
 *
 * Response (JSON):
 *   { success: true, outputUrl }
 */

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { createServiceClient } from '@/lib/supabase/service'
import { generateJewelryPhoto } from '@/lib/ai/gemini'
import {
  ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS,
  MODEL_PHOTO_MAP, VALID_MODEL_IDS,
} from '@/lib/constants'
import { assertSafeImageBytes } from '@/lib/utils/security'

export const maxDuration = 60
export const runtime = 'nodejs'

const DEMO_COOKIE       = 'luminify_demo_used'
const INPUT_BUCKET      = 'jewelry-uploads'
const OUTPUT_BUCKET     = 'generated-images'
const IP_WINDOW_MS      = 24 * 60 * 60 * 1000 // 24 h

// HIGH-1: Server-side IP rate limit (single-instance; use Redis for multi-instance)
// Keyed by real visitor IP; resets on container restart.
const ipLog = new Map<string, number>()

function getClientIp(req: Request): string {
  // CF-Connecting-IP is set by Cloudflare with the real visitor IP (stripped by CF)
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

export async function POST(request: Request) {
  try {
    // ── Rate limit 1: httpOnly cookie (UX layer) ─────────────────────────────
    const cookieHeader = request.headers.get('cookie') ?? ''
    if (cookieHeader.includes(`${DEMO_COOKIE}=1`)) {
      return err(
        'Вы уже использовали бесплатную генерацию. Зарегистрируйтесь для полного доступа.',
        429
      )
    }

    // ── Rate limit 2: server-side IP check (security layer) ──────────────────
    // HIGH-1: cannot be bypassed by deleting the cookie
    const clientIp = getClientIp(request)
    if (clientIp !== 'unknown') {
      const lastGen = ipLog.get(clientIp) ?? 0
      if (Date.now() - lastGen < IP_WINDOW_MS) {
        return err(
          'Вы уже использовали бесплатную генерацию. Зарегистрируйтесь для полного доступа.',
          429
        )
      }
    }

    // ── Parse multipart body ─────────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса. Используйте multipart/form-data.', 400)
    }

    const imageFile  = formData.get('image') as File | null
    const rawModelId = (formData.get('model_id') as string | null) || null

    // HIGH-5: validate model_id against static allowlist
    const modelId = rawModelId && VALID_MODEL_IDS.has(rawModelId) ? rawModelId : null

    if (!imageFile || imageFile.size === 0) {
      return err('Файл изображения не найден. Пожалуйста, загрузите фото украшения.', 400)
    }

    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(imageFile.type)) {
      return err(
        `Неподдерживаемый формат: ${imageFile.type}. Используйте JPG, PNG, WebP или HEIC.`,
        400
      )
    }

    if (imageFile.size > MAX_IMAGE_BYTES) {
      return err(
        `Файл ${(imageFile.size / 1024 / 1024).toFixed(1)} МБ превышает лимит 10 МБ.`,
        413
      )
    }

    // ── Upload source image via service-role client ──────────────────────────
    // Service-role bypasses RLS so we can write to shared demo/ folder
    const supabase  = createServiceClient()
    const rawExt    = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt   = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
    const inputPath = `demo/${Date.now()}-source.${safeExt}`
    const fileBytes = await imageFile.arrayBuffer()

    // MED-NEW-1: verify actual file content via magic bytes
    try {
      assertSafeImageBytes(new Uint8Array(fileBytes))
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Недопустимый формат файла.', 400)
    }

    const { error: uploadErr } = await supabase.storage
      .from(INPUT_BUCKET)
      .upload(inputPath, fileBytes, { contentType: imageFile.type, upsert: false })

    if (uploadErr) {
      console.error('Demo storage upload error:', uploadErr)
      return err('Ошибка загрузки файла. Проверьте соединение и попробуйте снова.', 500)
    }

    // Signed URL valid for 1 h — enough time for Replicate to fetch the image
    const { data: signedData } = await supabase.storage
      .from(INPUT_BUCKET)
      .createSignedUrl(inputPath, 3600)

    if (!signedData?.signedUrl) {
      return err('Не удалось получить доступ к загруженному файлу.', 500)
    }

    // ── Call Gemini ───────────────────────────────────────────────────────────
    let modelImageBuffer: Buffer | undefined
    let modelMimeType:    string | undefined
    if (modelId) {
      const modelPhoto = MODEL_PHOTO_MAP[modelId]
      const modelPath  = path.join(process.cwd(), 'public', 'models', modelPhoto.filename)
      modelImageBuffer = await fs.readFile(modelPath)
      modelMimeType    = modelPhoto.filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
    }

    let aiImageBuffer: Buffer
    let aiMimeType:    string
    try {
      const result = await generateJewelryPhoto({
        imageUrl:         signedData.signedUrl,
        modelImageBuffer,
        modelMimeType,
      })
      aiImageBuffer = result.imageBuffer
      aiMimeType    = result.mimeType
    } catch (aiErr) {
      console.error('Demo AI generation error:', aiErr)
      // HIGH-NEW-2: truncate error to 200 chars — never leak raw API internals
      const safeMsg = aiErr instanceof Error
        ? aiErr.message.slice(0, 200)
        : 'Ошибка генерации. Попробуйте снова или выберите другой тип украшения.'
      return err(safeMsg, 500)
    }

    // ── Upload Gemini result to our Storage ───────────────────────────────────
    // MED-NEW-2: use crypto.randomUUID() to avoid timestamp collision; upsert:false
    const ext        = aiMimeType === 'image/png' ? 'png' : 'jpg'
    const outputPath = `demo/${crypto.randomUUID()}-result.${ext}`

    const { error: resUploadErr } = await supabase.storage
      .from(OUTPUT_BUCKET)
      .upload(outputPath, aiImageBuffer, { contentType: aiMimeType, upsert: false })

    if (resUploadErr) {
      console.error('Demo result upload error:', resUploadErr)
      return err('Ошибка сохранения результата. Попробуйте снова.', 500)
    }

    const { data: pub }   = supabase.storage.from(OUTPUT_BUCKET).getPublicUrl(outputPath)
    const resultPublicUrl = pub.publicUrl

    // ── Record IP usage (HIGH-1) ─────────────────────────────────────────────
    if (clientIp !== 'unknown') {
      ipLog.set(clientIp, Date.now())
      // Prune entries older than 24 h to prevent unbounded memory growth
      if (ipLog.size > 5_000) {
        const cutoff = Date.now() - IP_WINDOW_MS
        ipLog.forEach((v, k) => {
          if (v < cutoff) ipLog.delete(k)
        })
      }
    }

    // ── Set cookie and return result ─────────────────────────────────────────
    const response = NextResponse.json({ success: true, outputUrl: resultPublicUrl })
    response.cookies.set(DEMO_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      // MED-9: secure flag — cookie must only be sent over HTTPS in production
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   60 * 60 * 24, // 24 hours
      path:     '/',
    })

    return response
  } catch (fatal) {
    console.error('Demo generate route fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
