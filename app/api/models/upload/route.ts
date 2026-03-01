/**
 * POST /api/models/upload
 *
 * Uploads a user's custom model photo and saves its URL to their profile.
 * The photo is stored in Supabase Storage and the URL persists across sessions.
 *
 * Request: multipart/form-data
 *   image  File — model photo (JPG/PNG/WebP/HEIC, max 10 MB)
 *
 * Response: { success: true, url: string }
 */

import { NextResponse }     from 'next/server'
import { createClient }     from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  SAFE_IMAGE_EXTENSIONS,
} from '@/lib/constants'

export const maxDuration = 30
export const runtime     = 'nodejs'

const OUTPUT_BUCKET = 'generated-images'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return err('Необходима авторизация.', 401)
    }

    // ── Parse form ────────────────────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса.', 400)
    }

    const imageFile = formData.get('image') as File | null

    if (!imageFile || imageFile.size === 0) {
      return err('Файл изображения не найден.', 400)
    }

    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(imageFile.type)) {
      return err(`Неподдерживаемый формат: ${imageFile.type}. Используйте JPG, PNG, WebP или HEIC.`, 400)
    }

    if (imageFile.size > MAX_IMAGE_BYTES) {
      return err(`Файл превышает лимит 10 МБ.`, 413)
    }

    // ── Upload to Storage ─────────────────────────────────────────────────────
    // Use a unique filename to bust browser cache on re-upload
    const rawExt  = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
    const filename = `custom-${Date.now()}.${safeExt}`
    const storagePath = `user-models/${user.id}/${filename}`

    const serviceSupabase = createServiceClient()
    const fileBytes = await imageFile.arrayBuffer()

    const { error: uploadErr } = await serviceSupabase.storage
      .from(OUTPUT_BUCKET)
      .upload(storagePath, fileBytes, {
        contentType: imageFile.type,
        upsert:      false,
      })

    if (uploadErr) {
      console.error('Custom model upload error:', uploadErr)
      return err('Ошибка загрузки файла. Попробуйте снова.', 500)
    }

    const { data: pub } = serviceSupabase.storage
      .from(OUTPUT_BUCKET)
      .getPublicUrl(storagePath)

    const publicUrl = pub.publicUrl

    // ── Save URL to profile ───────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ custom_model_url: publicUrl } as never)
      .eq('id', user.id)

    if (updateErr) {
      console.error('Profile update error:', updateErr)
      // Non-fatal: file is uploaded, just return the URL anyway
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (fatal) {
    console.error('Model upload fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
