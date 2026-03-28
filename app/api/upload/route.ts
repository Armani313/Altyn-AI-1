/**
 * POST /api/upload
 *
 * Uploads a jewelry photo to Supabase Storage and returns a signed URL.
 * Used for instant preview before generation (optional step).
 *
 * Request: multipart/form-data
 *   image  File — jewelry photo (JPG/PNG/WebP/HEIC, max 10 MB)
 *
 * Response (JSON):
 *   { path: string, signedUrl: string }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS } from '@/lib/constants'
import { assertSafeImageBytes } from '@/lib/utils/security'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Необходимо авторизоваться.' }, { status: 401 })
  }

  // HIGH-NEW-4: rate limit — 20 uploads per minute per user
  const rl = await checkRateLimit('upload', user.id, 20, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.` },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса.' }, { status: 400 })
  }

  const file = formData.get('image') as File | null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Файл не найден.' }, { status: 400 })
  }

  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Неподдерживаемый формат: ${file.type}. Используйте JPG, PNG, WebP или HEIC.` },
      { status: 400 }
    )
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `Файл превышает лимит 10 МБ.` },
      { status: 413 }
    )
  }

  const rawExt  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
  const path    = `${user.id}/${Date.now()}-upload.${safeExt}`
  const bytes   = await file.arrayBuffer()

  // MED-NEW-1: verify actual file content via magic bytes
  try {
    assertSafeImageBytes(new Uint8Array(bytes))
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Недопустимый формат файла.' },
      { status: 400 }
    )
  }

  const { error: uploadErr } = await supabase.storage
    .from('jewelry-uploads')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadErr) {
    console.error('Upload error:', uploadErr)
    return NextResponse.json({ error: 'Ошибка загрузки. Попробуйте снова.' }, { status: 500 })
  }

  const { data: signed } = await supabase.storage
    .from('jewelry-uploads')
    .createSignedUrl(path, 3600)

  return NextResponse.json({ path, signedUrl: signed?.signedUrl ?? null })
}
