/**
 * POST /api/tools/remove-bg
 *
 * Removes the background from an uploaded image using Cloudflare Image
 * Transformations (segment=foreground). Returns the result as a PNG blob.
 *
 * Body: FormData with `image` file field.
 * Response: image/png binary.
 */

import { NextResponse } from 'next/server'
import { MAX_IMAGE_BYTES } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPublicRateLimitIdentity, withPublicRateLimitCookie } from '@/lib/public-rate-limit'
import { assertSafeImageBytes, detectImageMimeType } from '@/lib/utils/security'
import { removeBackground } from '@/lib/cloudflare/remove-bg'

export const runtime = 'nodejs'
export const maxDuration = 60

const ROUTE_KEY = 'tools-remove-bg'
const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const rateIdentity = getPublicRateLimitIdentity(request)
  const respond = (r: NextResponse) => withPublicRateLimitCookie(r, rateIdentity.cookieIdToSet)

  // Rate limit: 10 requests per 10 minutes per identity
  const rl = await checkRateLimit(ROUTE_KEY, rateIdentity.key, 10, 10 * 60_000)
  if (!rl.ok) {
    return respond(
      NextResponse.json(
        { error: `Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.` },
        { status: 429 },
      ),
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return respond(
      NextResponse.json({ error: 'Неверный формат запроса.' }, { status: 400 }),
    )
  }

  const imageFile = formData.get('image')
  if (!(imageFile instanceof File)) {
    return respond(
      NextResponse.json({ error: 'Файл изображения не найден.' }, { status: 400 }),
    )
  }

  if (imageFile.size === 0) {
    return respond(
      NextResponse.json({ error: 'Файл изображения пустой.' }, { status: 400 }),
    )
  }

  if (imageFile.size > MAX_IMAGE_BYTES) {
    return respond(
      NextResponse.json(
        { error: `Файл ${(imageFile.size / 1024 / 1024).toFixed(1)} МБ превышает лимит 10 МБ.` },
        { status: 413 },
      ),
    )
  }

  const fileBytes = new Uint8Array(await imageFile.arrayBuffer())

  try {
    assertSafeImageBytes(fileBytes)
  } catch (error) {
    return respond(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Недопустимый формат файла.' },
        { status: 400 },
      ),
    )
  }

  const detectedMime = detectImageMimeType(fileBytes)
  if (!detectedMime || !ACCEPTED_MIME.has(detectedMime)) {
    return respond(
      NextResponse.json(
        { error: 'Поддерживаются только JPG, PNG и WebP.' },
        { status: 400 },
      ),
    )
  }

  try {
    const result = await removeBackground(fileBytes, detectedMime)

    return respond(
      new NextResponse(Buffer.from(result.imageBuffer), {
        status: 200,
        headers: {
          'Content-Type': result.mimeType,
          'Cache-Control': 'no-store',
        },
      }),
    )
  } catch (error) {
    console.error('[remove-bg] error:', error)
    return respond(
      NextResponse.json(
        { error: 'Не удалось удалить фон. Попробуйте снова.' },
        { status: 502 },
      ),
    )
  }
}
