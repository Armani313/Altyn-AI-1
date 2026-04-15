/**
 * POST /api/tools/upscale
 *
 * PUBLIC marketing tool — no auth / no credits by design.
 * Part of the free /tools/* marketing funnel; must stay reachable without a
 * Luminify account. Do NOT add credit deduction or authentication —
 * abuse is controlled via getPublicRateLimitIdentity.
 *
 * Different endpoint from /api/upscale (the authenticated, credit-charged
 * 4K panel upscale); same name, different intent.
 */
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS } from '@/lib/constants'
import { aiQueue } from '@/lib/queue'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPublicRateLimitIdentity, withPublicRateLimitCookie } from '@/lib/public-rate-limit'
import { assertSafeImageBytes, detectImageMimeType } from '@/lib/utils/security'

export const runtime = 'nodejs'
export const maxDuration = 120

const TOPAZ_ROUTE = 'tools-upscale'
const MAX_OUTPUT_EDGE = 32_000
const MAX_OUTPUT_PIXELS = 32_000_000
const SCALE_OPTIONS = new Set(['2x', '4x'])
const ACCEPTED_UPSCALE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
const TOPAZ_QUEUE_WAIT_MS = 120_000

function getSafeFileName(extension: string): string {
  return `upscale-source.${extension}`
}

type UpscaleErrorCode =
  | 'rate_limited'
  | 'invalid_body'
  | 'missing_image'
  | 'invalid_scale'
  | 'empty_file'
  | 'file_too_large'
  | 'invalid_image'
  | 'unsupported_format'
  | 'invalid_dimensions'
  | 'output_limit_edge'
  | 'output_limit_mp'
  | 'queue_busy'
  | 'provider_not_configured'
  | 'provider_auth'
  | 'provider_rate_limit'
  | 'provider_output_too_large'
  | 'provider_unknown'

function mapTopazFailure(message: string): {
  status: number
  code: UpscaleErrorCode
  message: string
} {
  if (message === 'Topaz API rejected the request. Check TOPAZ_API_KEY.') {
    return {
      status: 502,
      code: 'provider_auth',
      message: 'Сервис обработки отклонил запрос. Проверьте настройки доступа.',
    }
  }
  if (message === 'Topaz rate limit reached. Try again in a minute.') {
    return {
      status: 429,
      code: 'provider_rate_limit',
      message: 'Сервис обработки временно ограничил запросы. Попробуйте через минуту.',
    }
  }
  if (message === 'The image is too large for the enhancement API.') {
    return {
      status: 400,
      code: 'provider_output_too_large',
      message: 'Изображение слишком большое для обработки.',
    }
  }

  return {
    status: 502,
    code: 'provider_unknown',
    message,
  }
}

export async function POST(request: Request) {
  try {
    const rateIdentity = getPublicRateLimitIdentity(request)
    const respond = (response: NextResponse) => withPublicRateLimitCookie(response, rateIdentity.cookieIdToSet)
    const errorResponse = (message: string, status: number, code: UpscaleErrorCode) =>
      respond(err(message, status, code))
    const rl = await checkRateLimit(TOPAZ_ROUTE, rateIdentity.key, 4, 10 * 60_000)

    if (!rl.ok) {
      return errorResponse(`Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.`, 429, 'rate_limited')
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return errorResponse('Неверный формат запроса.', 400, 'invalid_body')
    }

    const imageFile = formData.get('image')
    const rawScale = (formData.get('scale') as string | null) ?? '4x'

    if (!(imageFile instanceof File)) {
      return errorResponse('Файл изображения не найден.', 400, 'missing_image')
    }

    if (!SCALE_OPTIONS.has(rawScale)) {
      return errorResponse('Параметр scale должен быть 2x или 4x.', 400, 'invalid_scale')
    }

    if (imageFile.size === 0) {
      return errorResponse('Файл изображения пустой.', 400, 'empty_file')
    }

    if (imageFile.size > MAX_IMAGE_BYTES) {
      return errorResponse(
        `Файл ${(imageFile.size / 1024 / 1024).toFixed(1)} МБ превышает лимит 10 МБ.`,
        413,
        'file_too_large',
      )
    }

    const fileBytes = new Uint8Array(await imageFile.arrayBuffer())

    try {
      assertSafeImageBytes(fileBytes)
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Недопустимый формат файла.',
        400,
        'invalid_image',
      )
    }

    const detectedMimeType = detectImageMimeType(fileBytes)
    if (!detectedMimeType || !ACCEPTED_UPSCALE_MIME_TYPES.has(detectedMimeType)) {
      return errorResponse('Поддерживаются только JPG, PNG, WebP и HEIC изображения.', 400, 'unsupported_format')
    }

    const image = sharp(fileBytes, { failOn: 'error' })
    const metadata = await image.metadata()
    const sourceWidth = metadata.width
    const sourceHeight = metadata.height

    if (!sourceWidth || !sourceHeight) {
      return errorResponse('Не удалось определить размер изображения.', 400, 'invalid_dimensions')
    }

    const requestedScale = rawScale === '4x' ? 4 : 2
    const targetWidth = Math.round(sourceWidth * requestedScale)
    const targetHeight = Math.round(sourceHeight * requestedScale)

    if (targetWidth > MAX_OUTPUT_EDGE || targetHeight > MAX_OUTPUT_EDGE) {
      return errorResponse(
        `Результат ${targetWidth}×${targetHeight}px слишком большой. Выберите меньшее увеличение или более компактный исходник.`,
        400,
        'output_limit_edge',
      )
    }

    const targetPixels = targetWidth * targetHeight
    if (targetPixels > MAX_OUTPUT_PIXELS) {
      return errorResponse(
        `Результат ${targetWidth}×${targetHeight}px (${(targetPixels / 1_000_000).toFixed(1)} MP) превышает лимит 32 MP. Выберите 2x или загрузите изображение меньшего размера.`,
        400,
        'output_limit_mp',
      )
    }

    let upstreamBuffer = fileBytes
    let upstreamMimeType = detectedMimeType
    let upstreamExt = imageFile.name.split('.').pop()?.toLowerCase() ?? 'png'

    if (detectedMimeType === 'image/webp' || detectedMimeType === 'image/heic') {
      upstreamBuffer = new Uint8Array(await sharp(fileBytes).png().toBuffer())
      upstreamMimeType = 'image/png'
      upstreamExt = 'png'
    }

    if (!(SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(upstreamExt)) {
      upstreamExt = 'png'
    }

    const queuedJob = aiQueue.enqueue({
      userId: rateIdentity.key,
      providerId: 'topaz',
      type: 'image',
      params: {
        imageBuffer: upstreamBuffer,
        mimeType: upstreamMimeType,
        fileName: getSafeFileName(upstreamExt),
        outputWidth: targetWidth,
        outputHeight: targetHeight,
      },
    })

    const completedJob = await aiQueue.waitForJob(queuedJob.id, TOPAZ_QUEUE_WAIT_MS)

    if (completedJob.status !== 'completed' || !completedJob.result?.imageBuffer) {
      const safeErrMsg = (completedJob.error ?? 'Не удалось улучшить фото. Попробуйте снова.').slice(0, 200)
      const mappedFailure = mapTopazFailure(safeErrMsg)

      return errorResponse(
        completedJob.status === 'queued'
          ? 'Сервис обработки сейчас занят. Попробуйте ещё раз через минуту.'
          : mappedFailure.message,
        completedJob.status === 'queued' ? 504 : mappedFailure.status,
        completedJob.status === 'queued' ? 'queue_busy' : mappedFailure.code,
      )
    }

    const result = {
      imageBuffer: completedJob.result.imageBuffer,
      mimeType: completedJob.result.mimeType ?? 'image/png',
    }

    const responseBody = Uint8Array.from(result.imageBuffer).buffer

    return respond(new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Cache-Control': 'no-store',
        'X-Upscale-Source-Width': String(sourceWidth),
        'X-Upscale-Source-Height': String(sourceHeight),
        'X-Upscale-Output-Width': String(targetWidth),
        'X-Upscale-Output-Height': String(targetHeight),
      },
    }))
  } catch (error) {
    console.error('[tools-upscale] fatal error:', error)
    const message = error instanceof Error ? error.message : 'Не удалось улучшить фото.'
    const rateIdentity = getPublicRateLimitIdentity(request)
    const respond = (response: NextResponse) => withPublicRateLimitCookie(response, rateIdentity.cookieIdToSet)

    if (message === 'TOPAZ_API_KEY env var is not configured.') {
      return respond(err('Сервис улучшения не настроен на сервере.', 503, 'provider_not_configured'))
    }
    const mapped = mapTopazFailure(message)
    return respond(err(
      mapped.code === 'provider_unknown' ? 'Не удалось улучшить фото. Попробуйте снова.' : mapped.message,
      mapped.code === 'provider_unknown' ? 500 : mapped.status,
      mapped.code,
    ))
  }
}

function err(message: string, status: number, code: UpscaleErrorCode) {
  return NextResponse.json({ error: message, code }, { status })
}
