/**
 * POST /api/tools/topaz-image
 *
 * PUBLIC marketing tool — no auth / no credits by design.
 * Part of the free /tools/* marketing funnel; must stay reachable without a
 * Luminify account. Do NOT add credit deduction or authentication —
 * abuse is controlled via getPublicRateLimitIdentity.
 */
import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS } from '@/lib/constants'
import { aiQueue } from '@/lib/queue'
import { checkRateLimit } from '@/lib/rate-limit'
import { getTopazToolSeed, isTopazToolSlug } from '@/lib/tools/topaz-tools'
import type { TopazAsyncImageParams } from '@/lib/ai/topaz-image-tools'
import type { TopazEnhanceParams } from '@/lib/ai/topaz-upscale'
import { getPublicRateLimitIdentity, withPublicRateLimitCookie } from '@/lib/public-rate-limit'
import { assertSafeImageBytes, detectImageMimeType } from '@/lib/utils/security'

export const runtime = 'nodejs'
export const maxDuration = 240

const TOPAZ_ROUTE = 'tools-topaz-image'
const MAX_OUTPUT_EDGE = 32_000
const MAX_OUTPUT_PIXELS = 32_000_000
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
const WAIT_TIMEOUT_MS = 220_000

type ErrorCode =
  | 'rate_limited'
  | 'invalid_body'
  | 'missing_tool'
  | 'tool_unavailable'
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
  | 'provider_timeout'
  | 'provider_unknown'

function getSafeFileName(extension: string): string {
  return `topaz-tool-source.${extension}`
}

function err(message: string, status: number, code: ErrorCode) {
  return NextResponse.json({ error: message, code }, { status })
}

function mapTopazFailure(message: string): {
  status: number
  code: ErrorCode
  message: string
} {
  if (message === 'TOPAZ_API_KEY env var is not configured.') {
    return {
      status: 500,
      code: 'provider_not_configured',
      message: 'Сервис обработки пока не настроен.',
    }
  }
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
  if (message.includes('timeout')) {
    return {
      status: 504,
      code: 'provider_timeout',
      message: 'Обработка заняла слишком много времени. Попробуйте ещё раз с другим изображением.',
    }
  }

  return {
    status: 502,
    code: 'provider_unknown',
    message,
  }
}

function buildJobParams(
  processor: NonNullable<ReturnType<typeof getTopazToolSeed>['processor']>,
  input: {
    imageBuffer: Uint8Array
    mimeType: string
    fileName: string
    targetWidth: number
    targetHeight: number
  },
): TopazEnhanceParams | TopazAsyncImageParams {
  switch (processor) {
    case 'enhance':
      return {
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        model: 'Standard V2',
        fields: {
          sharpen: 0.18,
          denoise: 0.12,
          fix_compression: 0.08,
        },
      }
    case 'enhance-faces':
      return {
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        model: 'Standard V2',
        fields: {
          face_enhancement: true,
          face_enhancement_strength: 0.65,
          face_enhancement_creativity: 0.12,
          sharpen: 0.12,
        },
      }
    case 'enhance-cgi':
      return {
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        model: 'CGI',
        fields: {
          sharpen: 0.16,
          denoise: 0.05,
        },
      }
    case 'enhance-art':
      return {
        operation: 'topaz-async-image',
        endpoint: 'enhance-gen',
        model: 'Redefine',
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        fields: {
          autoprompt: true,
          creativity: 2,
          texture: 2,
          sharpen: 0.12,
          denoise: 0.08,
        },
      }
    case 'sharpen':
      return {
        operation: 'topaz-async-image',
        endpoint: 'sharpen',
        model: 'Standard',
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        fields: {
          strength: 0.55,
          minor_denoise: 0.12,
        },
      }
    case 'unblur':
      return {
        operation: 'topaz-async-image',
        endpoint: 'sharpen-gen',
        model: 'Super Focus V2',
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        fields: {
          detail: 0.55,
          focus_boost: 0.35,
        },
      }
    case 'denoise':
      return {
        operation: 'topaz-async-image',
        endpoint: 'denoise',
        model: 'Normal',
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        fields: {
          strength: 0.5,
          minor_deblur: 0.18,
          original_detail: 0.16,
        },
      }
    case 'lighting':
      return {
        operation: 'topaz-async-image',
        endpoint: 'lighting',
        model: 'Adjust V2',
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        fields: {
          exposure: 1.15,
          highlight: 0.95,
          shadow: 1.12,
        },
      }
    case 'restore':
      return {
        operation: 'topaz-async-image',
        endpoint: 'restore-gen',
        model: 'Dust-Scratch V2',
        imageBuffer: input.imageBuffer,
        mimeType: input.mimeType,
        fileName: input.fileName,
        outputWidth: input.targetWidth,
        outputHeight: input.targetHeight,
        fields: {
          grain: false,
        },
      }
  }
}

export async function POST(request: Request) {
  try {
    const rateIdentity = getPublicRateLimitIdentity(request)
    const respond = (response: NextResponse) => withPublicRateLimitCookie(response, rateIdentity.cookieIdToSet)
    const errorResponse = (message: string, status: number, code: ErrorCode) =>
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

    const toolSlug = formData.get('toolSlug')
    const imageFile = formData.get('image')
    const rawScale = (formData.get('scale') as string | null) ?? '2x'

    if (typeof toolSlug !== 'string' || !isTopazToolSlug(toolSlug)) {
      return errorResponse('Инструмент не найден.', 400, 'missing_tool')
    }

    const tool = getTopazToolSeed(toolSlug)
    if (tool.status !== 'live' || tool.runtime !== 'image' || !tool.processor) {
      return errorResponse('Этот инструмент пока недоступен.', 501, 'tool_unavailable')
    }

    if (!(imageFile instanceof File)) {
      return errorResponse('Файл изображения не найден.', 400, 'missing_image')
    }

    if (tool.heroMode === 'scale' && rawScale !== '2x' && rawScale !== '4x') {
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
    if (!detectedMimeType || !ACCEPTED_MIME_TYPES.has(detectedMimeType)) {
      return errorResponse('Поддерживаются только JPG, PNG, WebP и HEIC изображения.', 400, 'unsupported_format')
    }

    const image = sharp(fileBytes, { failOn: 'error' })
    const metadata = await image.metadata()
    const sourceWidth = metadata.width
    const sourceHeight = metadata.height

    if (!sourceWidth || !sourceHeight) {
      return errorResponse('Не удалось определить размер изображения.', 400, 'invalid_dimensions')
    }

    const requestedScale = tool.heroMode === 'scale'
      ? rawScale === '4x'
        ? 4
        : 2
      : 1
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
        `Результат ${targetWidth}×${targetHeight}px (${(targetPixels / 1_000_000).toFixed(1)} MP) превышает лимит 32 MP. Выберите меньшее увеличение или более компактное исходное изображение.`,
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
      params: buildJobParams(tool.processor, {
        imageBuffer: upstreamBuffer,
        mimeType: upstreamMimeType,
        fileName: getSafeFileName(upstreamExt),
        targetWidth,
        targetHeight,
      }),
    })

    const completedJob = await aiQueue.waitForJob(queuedJob.id, WAIT_TIMEOUT_MS)

    if (completedJob.status !== 'completed' || !completedJob.result?.imageBuffer) {
      const safeErrMsg = (completedJob.error ?? 'Не удалось обработать изображение. Попробуйте снова.').slice(0, 240)
      const mappedFailure = mapTopazFailure(safeErrMsg)

      return errorResponse(
        completedJob.status === 'queued'
          ? 'Сервис обработки сейчас занят. Попробуйте ещё раз немного позже.'
          : mappedFailure.message,
        completedJob.status === 'queued' ? 504 : mappedFailure.status,
        completedJob.status === 'queued' ? 'queue_busy' : mappedFailure.code,
      )
    }

    return respond(new NextResponse(Uint8Array.from(completedJob.result.imageBuffer).buffer, {
      status: 200,
      headers: {
        'Content-Type': completedJob.result.mimeType ?? 'image/png',
        'Cache-Control': 'no-store',
      },
    }))
  } catch (error) {
    console.error('[topaz-image-route] fatal error:', error)
    const rateIdentity = getPublicRateLimitIdentity(request)
    return withPublicRateLimitCookie(
      err('Не удалось обработать изображение. Попробуйте снова.', 500, 'provider_unknown'),
      rateIdentity.cookieIdToSet,
    )
  }
}
