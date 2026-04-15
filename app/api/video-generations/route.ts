import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rate-limit'
import { refundByWithRetry } from '@/lib/utils/refund'
import { assertSafeImageBytes } from '@/lib/utils/security'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  SAFE_IMAGE_EXTENSIONS,
} from '@/lib/constants'
import { startVeoVideoGeneration } from '@/lib/ai/veo'
import {
  VIDEO_INPUT_BUCKET,
  VIDEO_PROVIDER,
} from '@/lib/video/constants'
import { readMetadataObject } from '@/lib/generate/panel-variants'
import { canAccessPremiumTemplates } from '@/lib/config/plans'
import { calculateVideoCredits, sanitizeVideoSettings } from '@/lib/video/options'
import type { Plan, VideoTemplate } from '@/types/database.types'

export const runtime = 'nodejs'
export const maxDuration = 120

const TEMPLATE_ID_REGEX = /^[a-z0-9-]+$/

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function buildVideoPrompt(templatePrompt: string) {
  return [
    templatePrompt.trim(),
    'Use the uploaded image as the source of truth for the product.',
    'Preserve the exact geometry, stone arrangement, material, polish, and silhouette.',
    'Deliver a premium social-ready vertical product reel with smooth realistic motion.',
  ].join('\n\n')
}

function getOptionalFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

async function removeInputPath(inputPath: string) {
  try {
    const serviceSupabase = createServiceClient()
    await serviceSupabase.storage.from(VIDEO_INPUT_BUCKET).remove([inputPath])
  } catch (cleanupError) {
    console.error('[video-generations] input cleanup error:', cleanupError)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return err('Необходимо авторизоваться для генерации видео.', 401)
    }

    const rl = await checkRateLimit('video-generate', user.id, 6, 10 * 60_000)
    if (!rl.ok) {
      return err(`Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.`, 429)
    }

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('credits_remaining, plan')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { credits_remaining: number; plan: Plan } | null
    if (!profile) {
      return err('Профиль пользователя не найден.', 404)
    }
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса. Используйте multipart/form-data.', 400)
    }

    const imageFile = formData.get('image') as File | null
    const templateId = ((formData.get('template_id') as string | null) ?? '').trim()
    const settings = sanitizeVideoSettings(
      {
        aspectRatio: getOptionalFormValue(formData, 'aspect_ratio'),
        durationSeconds: getOptionalFormValue(formData, 'duration_seconds'),
        resolution: getOptionalFormValue(formData, 'resolution'),
        voiceMode: getOptionalFormValue(formData, 'voice_mode'),
      },
      { isUgcTemplate: false }
    )
    const creditsCost = calculateVideoCredits(settings)

    if (!TEMPLATE_ID_REGEX.test(templateId)) {
      return err('Неверный video template id.', 400)
    }

    if (!imageFile || imageFile.size === 0) {
      return err('Файл изображения не найден. Пожалуйста, загрузите фото.', 400)
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

    if (profile.credits_remaining < creditsCost) {
      return err(
        `Недостаточно кредитов. Для видео нужно ${creditsCost}, доступно ${profile.credits_remaining}.`,
        402
      )
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    try {
      assertSafeImageBytes(new Uint8Array(imageBuffer))
    } catch (validationError) {
      return err(
        validationError instanceof Error ? validationError.message : 'Недопустимый формат файла.',
        400
      )
    }

    const { data: templateRaw, error: templateError } = await supabase
      .from('video_templates')
      .select('id, name, description, cover_image_url, demo_video_url, prompt_template, aspect_ratio, label, is_premium, is_active')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    const template = templateRaw as VideoTemplate | null

    if (templateError || !template) {
      return err('Видео-шаблон не найден.', 404)
    }

    if (template.is_premium && !canAccessPremiumTemplates(profile.plan)) {
      return err(
        'Этот видео-шаблон доступен только на тарифах Pro и Business. Обновите подписку в разделе «Настройки → Оплата».',
        403
      )
    }

    const rawExt = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
    const inputPath = `${user.id}/${Date.now()}-video-source.${safeExt}`

    const { error: uploadErr } = await supabase.storage
      .from(VIDEO_INPUT_BUCKET)
      .upload(inputPath, imageBuffer, { contentType: imageFile.type, upsert: false })

    if (uploadErr) {
      console.error('[video-generations] storage upload error:', uploadErr)
      return err('Ошибка загрузки файла. Проверьте соединение и попробуйте снова.', 500)
    }

    const prompt = buildVideoPrompt(template.prompt_template)
    const metadata = {
      aspect_ratio: settings.aspectRatio,
      duration_seconds: settings.durationSeconds,
      resolution: settings.resolution,
      voice_mode: settings.voiceMode,
      prompt,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        cover_image_url: template.cover_image_url,
        demo_video_url: template.demo_video_url,
        label: template.label,
        aspect_ratio: template.aspect_ratio,
      },
    }

    const { data: generationRaw, error: insertError } = await supabase
      .from('video_generations')
      .insert({
        user_id: user.id,
        video_template_id: template.id,
        input_image_url: inputPath,
        status: 'queued',
        provider: VIDEO_PROVIDER,
        credits_charged: creditsCost,
        metadata,
      } as never)
      .select('id')
      .single()

    const generation = generationRaw as { id: string } | null
    if (insertError || !generation?.id) {
      console.error('[video-generations] insert error:', insertError)
      await removeInputPath(inputPath)
      return err('Ошибка создания видео-задания. Попробуйте снова.', 500)
    }

    const generationId = generation.id
    const serviceSupabase = createServiceClient()

    // Debit the exact computed credit cost for this video request.
    // The RPC also writes a matching audit row to credit_transactions.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creditsAfter, error: debitError } = await (serviceSupabase as any)
      .rpc('decrement_credits_by', {
        p_user_id: user.id,
        p_amount: creditsCost,
        p_reason: 'video',
        p_ref_id: generationId,
      })

    if (debitError) {
      console.error('[video-generations] credit decrement error:', debitError)
      await serviceSupabase.from('video_generations').delete().eq('id', generationId)
      await removeInputPath(inputPath)
      return err('Ошибка списания кредита. Попробуйте снова.', 500)
    }

    if (creditsAfter === -1) {
      await serviceSupabase.from('video_generations').delete().eq('id', generationId)
      await removeInputPath(inputPath)
      return err(
        'Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».',
        402
      )
    }

    try {
      const { operationName } = await startVeoVideoGeneration({
        prompt,
        imageBuffer,
        imageMimeType: imageFile.type,
        aspectRatio: settings.aspectRatio,
        durationSeconds: settings.durationSeconds,
        resolution: settings.resolution,
      })

      await serviceSupabase
        .from('video_generations')
        .update({
          status: 'processing',
          provider_operation_name: operationName,
          metadata: {
            ...readMetadataObject(metadata),
            credits_remaining_after_charge: creditsAfter,
          },
        } as never)
        .eq('id', generationId)
        .eq('user_id', user.id)

      return NextResponse.json(
        {
          success: true,
          generationId,
          status: 'processing',
          creditsRemaining: creditsAfter as number,
        },
        { status: 202 }
      )
    } catch (providerError) {
      const message = providerError instanceof Error
        ? providerError.message
        : 'Ошибка запуска Veo. Попробуйте снова.'

      console.error('[video-generations] Veo start error:', providerError)
      await refundByWithRetry(
        serviceSupabase,
        user.id,
        creditsCost,
        'refund_video',
        generationId,
        'Video/Start',
      )
      await serviceSupabase
        .from('video_generations')
        .update({
          status: 'failed',
          error_message: message.slice(0, 240),
        } as never)
        .eq('id', generationId)
        .eq('user_id', user.id)

      return err(message.slice(0, 240), 500)
    }
  } catch (fatalError) {
    console.error('[video-generations] fatal error:', fatalError)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}
