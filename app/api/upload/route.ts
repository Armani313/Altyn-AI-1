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

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Необходимо авторизоваться.' }, { status: 401 })
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

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Неподдерживаемый формат: ${file.type}. Используйте JPG, PNG, WebP или HEIC.` },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Файл превышает лимит 10 МБ.` },
      { status: 413 }
    )
  }

  const rawExt  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = /^(jpg|jpeg|png|webp|heic|heif)$/.test(rawExt) ? rawExt : 'jpg'
  const path    = `${user.id}/${Date.now()}-upload.${safeExt}`
  const bytes   = await file.arrayBuffer()

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
