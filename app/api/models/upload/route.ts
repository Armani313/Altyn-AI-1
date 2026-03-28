/**
 * POST /api/models/upload
 *
 * Uploads a user's custom model photo and appends its URL to their profile array.
 * Users can keep up to MAX_CUSTOM_MODELS (5) photos simultaneously.
 *
 * Request: multipart/form-data
 *   image  File — model photo (JPG/PNG/WebP/HEIC, max 10 MB)
 *
 * Response: { success: true, urls: string[], index: number }
 */

import { NextResponse }      from 'next/server'
import { createClient }      from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  SAFE_IMAGE_EXTENSIONS,
  MAX_CUSTOM_MODELS,
} from '@/lib/constants'
import { assertSafeImageBytes } from '@/lib/utils/security'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30
export const runtime     = 'nodejs'

const OUTPUT_BUCKET = 'generated-images'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Необходима авторизация.', 401)

    // HIGH-NEW-4: rate limit — 10 model uploads per 5 minutes per user
    const rl = await checkRateLimit('models-upload', user.id, 10, 5 * 60_000)
    if (!rl.ok) {
      return err(`Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.`, 429)
    }

    // ── Parse form ────────────────────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса.', 400)
    }

    const imageFile = formData.get('image') as File | null

    if (!imageFile || imageFile.size === 0) return err('Файл изображения не найден.', 400)

    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(imageFile.type)) {
      return err(`Неподдерживаемый формат: ${imageFile.type}. Используйте JPG, PNG, WebP или HEIC.`, 400)
    }

    if (imageFile.size > MAX_IMAGE_BYTES) return err('Файл превышает лимит 10 МБ.', 413)

    // ── Check current count ───────────────────────────────────────────────────
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('custom_model_urls')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: string[] = (profileRaw as any)?.custom_model_urls ?? []

    if (current.length >= MAX_CUSTOM_MODELS) {
      return err(`Максимум ${MAX_CUSTOM_MODELS} моделей. Удалите одну перед загрузкой новой.`, 400)
    }

    // ── Upload to Storage ─────────────────────────────────────────────────────
    const rawExt  = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
    const filename    = `custom-${Date.now()}.${safeExt}`
    const storagePath = `user-models/${user.id}/${filename}`

    const serviceSupabase = createServiceClient()
    const fileBytes = await imageFile.arrayBuffer()

    // MED-NEW-1: verify actual file content via magic bytes
    try {
      assertSafeImageBytes(new Uint8Array(fileBytes))
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Недопустимый формат файла.', 400)
    }

    const { error: uploadErr } = await serviceSupabase.storage
      .from(OUTPUT_BUCKET)
      .upload(storagePath, fileBytes, { contentType: imageFile.type, upsert: false })

    if (uploadErr) {
      console.error('Custom model upload error:', uploadErr)
      return err('Ошибка загрузки файла. Попробуйте снова.', 500)
    }

    const { data: pub } = serviceSupabase.storage.from(OUTPUT_BUCKET).getPublicUrl(storagePath)
    const publicUrl = pub.publicUrl

    // ── Append URL to profile array ───────────────────────────────────────────
    const updated = [...current, publicUrl]

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ custom_model_urls: updated } as never)
      .eq('id', user.id)

    if (updateErr) {
      console.error('Profile update error:', updateErr)
      // Non-fatal: file is uploaded, return URL anyway
    }

    return NextResponse.json({ success: true, urls: updated, index: updated.length - 1 })
  } catch (fatal) {
    console.error('Model upload fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
