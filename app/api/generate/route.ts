/**
 * POST /api/generate
 *
 * Full AI generation pipeline for lifestyle photos.
 *
 * Request: multipart/form-data
 *   image             File    — product photo (JPG/PNG/WebP/HEIC, max 10 MB)
 *   template_id       string? — template UUID from the templates table
 *   template_category string? — 'rings' | 'necklaces' | 'earrings' | 'bracelets'
 *   aspect_ratio      string? — '1:1' | '9:16'  (default: '1:1')
 *
 * Response (JSON):
 *   { success: true, generationId, outputUrl, creditsRemaining }
 *
 * Pipeline:
 *   1.  Auth check
 *   2.  Rate limit check (10 req / 60 s per user)
 *   3.  Credits pre-check (fast fail before any I/O)
 *   4.  Validate & parse multipart body + magic bytes check
 *   5.  Upload source image → Supabase Storage
 *   6.  Create "processing" generation record
 *   7.  Atomic credit decrement BEFORE AI call (prevents free generations on race)
 *   8.  Call Gemini AI
 *        → On failure: refund credit, mark failed, return error
 *   9.  Upload AI result → Storage
 *   10. Mark generation completed
 *   11. Return result
 */

import { after, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { aiQueue } from '@/lib/queue'
import type { GenerationParams } from '@/lib/ai/gemini'
import { finalizeGenerateJob, type FinalizeGenerateJobMeta } from '@/lib/generate/finalize-generate-job'
import {
  ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS,
  MODEL_PHOTO_MAP, VALID_MODEL_IDS, VALID_PRODUCT_TYPES,
  isCustomModelId, getCustomModelIndex,
  isMacroShotId, MACRO_SHOT_ID,
  UUID_REGEX,
  type ProductType,
} from '@/lib/constants'
import { CUSTOM_CARD_TEMPLATE_ID } from '@/lib/card-templates'
import { sanitizePrompt, checkPrompt } from '@/lib/ai/moderation'
import { assertSafeImageBytes } from '@/lib/utils/security'
import { checkRateLimit } from '@/lib/rate-limit'
import { refundByWithRetry } from '@/lib/utils/refund'
import { downloadCustomModel } from '@/lib/custom-models'
import { canAccessPremiumTemplates, getGenerationQueuePriority } from '@/lib/config/plans'
import type { Plan } from '@/types/database.types'

export const maxDuration = 240
export const runtime = 'nodejs'

const INPUT_BUCKET  = 'jewelry-uploads'
const VALID_CATEGORIES = ['rings', 'necklaces', 'earrings', 'bracelets', 'universal'] as const
const VALID_RATIOS     = ['1:1', '9:16', '4:5'] as const
const ASYNC_GENERATION_TIMEOUT_MS = 7 * 60 * 1000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return err('Необходимо авторизоваться для генерации изображений.', 401)
    }

    // ── 2. Rate limit (HIGH-NEW-4) ────────────────────────────────────────────
    // Queue-backed flow can safely absorb larger client bursts.
    // Allow a full batch of enqueues, then let the shared Gemini queue smooth execution.
    const rl = await checkRateLimit('generate', user.id, 30, 60_000)
    if (!rl.ok) {
      return err(
        `Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.`,
        429
      )
    }

    // ── 3. Credits pre-check ─────────────────────────────────────────────────
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('credits_remaining, plan')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { credits_remaining: number; plan: Plan } | null

    if (!profile) {
      return err('Профиль пользователя не найден. Обратитесь в поддержку.', 404)
    }

    if (profile.credits_remaining <= 0) {
      return err(
        'Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».',
        402
      )
    }

    // ── 4. Parse & validate multipart body ───────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса. Используйте multipart/form-data.', 400)
    }

    const imageFile = formData.get('image') as File | null

    const rawTemplateId   = (formData.get('template_id') as string | null) || null
    const rawCategory     = (formData.get('template_category') as string) || ''
    const rawRatio        = (formData.get('aspect_ratio') as string) || ''
    const rawModelId      = (formData.get('model_id') as string | null) || null
    const rawProductType  = (formData.get('product_type') as string) || ''
    const rawUserPrompt   = (formData.get('user_prompt') as string | null) || ''
    const rawGenerateMode = (formData.get('generate_mode') as string | null) || ''
    const rawProductName  = ((formData.get('product_name') as string | null) || '').slice(0, 100)
    const rawBrandName    = ((formData.get('brand_name')   as string | null) || '').slice(0, 60)
    const rawProductDesc  = ((formData.get('product_description') as string | null) || '').slice(0, 500)

    const isCardFreeCS    = rawGenerateMode === 'card-free-contact-sheet'
    const isCardFree      = rawGenerateMode === 'card-free' || isCardFreeCS
    const isFreeLifestyle = rawGenerateMode === 'lifestyle-free'
    const isContactSheet  = rawGenerateMode === 'contact-sheet' || isCardFreeCS || isFreeLifestyle
    console.log(`[Generate] mode="${rawGenerateMode}" isContactSheet=${isContactSheet} isCardFree=${isCardFree} isFreeLifestyle=${isFreeLifestyle} modelId="${rawModelId}" productType="${rawProductType}"`)


    // Allowed aspect ratios for contact sheet (per Gemini API supported values)
    // '4:5' is not supported by Gemini — map it to the closest '3:4'.
    const VALID_CS_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const
    const rawCsRatio = (
      (formData.get('contact_sheet_ratio') as string | null) ||
      (formData.get('aspect_ratio')        as string | null) ||
      '1:1'
    )
    const normalizedCsRatio = rawCsRatio === '4:5' ? '3:4' : rawCsRatio
    const contactSheetRatio = (VALID_CS_RATIOS as readonly string[]).includes(normalizedCsRatio)
      ? normalizedCsRatio
      : '1:1'

    // Card template ID — validated against known keys (e.g. 'tpl-01')
    const CARD_TPL_REGEX = /^tpl-\d+$/
    const cardTemplateId = rawTemplateId !== null && CARD_TPL_REGEX.test(rawTemplateId)
      ? rawTemplateId
      : null

    const userPrompt = sanitizePrompt(rawUserPrompt)
    if (userPrompt) {
      const mod = checkPrompt(userPrompt)
      if (!mod.safe) return err(mod.message!, 400)
    }

    const templateId = rawTemplateId !== null
      ? (UUID_REGEX.test(rawTemplateId) ? rawTemplateId : null)
      : null

    // HIGH-1: explicit error for supplied-but-invalid category (prevent silent fallback)
    if (rawCategory && !(VALID_CATEGORIES as readonly string[]).includes(rawCategory)) {
      return err(`Неверная категория: "${rawCategory.slice(0, 30)}". Допустимые: ${VALID_CATEGORIES.join(', ')}.`, 400)
    }
    const templateCategory = (VALID_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory
      : 'rings'

    const aspectRatio = (VALID_RATIOS as readonly string[]).includes(rawRatio)
      ? rawRatio as '1:1' | '9:16' | '4:5'
      : '1:1'

    const isMacroShot   = rawModelId !== null && isMacroShotId(rawModelId)
    const isCustomModel = !isMacroShot && rawModelId !== null && isCustomModelId(rawModelId)
    const modelId = isCustomModel
      ? null
      : isMacroShot
      ? MACRO_SHOT_ID
      : (rawModelId && VALID_MODEL_IDS.has(rawModelId) ? rawModelId : null)
    const modelPhoto = modelId ? MODEL_PHOTO_MAP[modelId] : null
    const premiumTemplatesUnlocked = canAccessPremiumTemplates(profile.plan)

    const productType: ProductType = (VALID_PRODUCT_TYPES as Set<string>).has(rawProductType)
      ? rawProductType as ProductType
      : 'jewelry'

    if (modelPhoto?.premium && !premiumTemplatesUnlocked) {
      return err(
        'Этот шаблон доступен только на тарифах Pro и Business. Обновите подписку в разделе «Настройки → Оплата».',
        403
      )
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

    const fileBytes = await imageFile.arrayBuffer()

    // MED-NEW-1: verify actual file content via magic bytes (not just Content-Type)
    try {
      assertSafeImageBytes(new Uint8Array(fileBytes))
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Недопустимый формат файла.', 400)
    }

    // ── 5. Upload source image ────────────────────────────────────────────────
    const serviceSupabase = createServiceClient()

    let cardTemplateMeta: { image_url: string; is_premium: boolean } | null = null
    if (cardTemplateId && !isCardFree) {
      const { data: tplRow } = await serviceSupabase
        .from('card_templates')
        .select('image_url, is_premium')
        .eq('id', cardTemplateId)
        .eq('is_active', true)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cardTemplateMeta = (tplRow as any) as { image_url: string; is_premium: boolean } | null

      if (cardTemplateMeta?.is_premium && !premiumTemplatesUnlocked) {
        return err(
          'Этот шаблон доступен только на тарифах Pro и Business. Обновите подписку в разделе «Настройки → Оплата».',
          403
        )
      }
    }

    const rawExt    = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt   = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
    const inputPath = `${user.id}/${Date.now()}-source.${safeExt}`

    const { error: uploadErr } = await supabase.storage
      .from(INPUT_BUCKET)
      .upload(inputPath, fileBytes, { contentType: imageFile.type, upsert: false })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return err('Ошибка загрузки файла. Проверьте соединение и попробуйте снова.', 500)
    }

    const { data: signedData } = await supabase.storage
      .from(INPUT_BUCKET)
      .createSignedUrl(inputPath, 3600)

    if (!signedData?.signedUrl) {
      return err('Не удалось получить доступ к загруженному файлу.', 500)
    }

    // ── 6. Create "processing" generation record ──────────────────────────────
    const statusToken = crypto.randomUUID()
    const initialMetadata = {
      aspect_ratio: aspectRatio,
      template_category: templateCategory,
      model_id: modelId ?? null,
      product_type: productType,
      is_contact_sheet: isContactSheet || undefined,
      status_poll_token: statusToken,
    }

    const { data: genRaw, error: genInsertErr } = await supabase
      .from('generations')
      .insert({
        user_id:         user.id,
        template_id:     templateId,
        input_image_url: inputPath,
        status:          'processing',
        metadata:        initialMetadata,
      } as never)
      .select('id')
      .single()

    const gen = genRaw as { id: string } | null

    if (genInsertErr || !gen?.id) {
      console.error('Generation insert error:', genInsertErr)
      return err('Ошибка создания задания. Попробуйте снова.', 500)
    }

    const generationId  = gen.id

    // ── 7. Atomic credit decrement BEFORE AI (MED-NEW-4) ─────────────────────
    // Must use service client so auth.role() = 'service_role' — the trigger in
    // 003_security.sql only allows credits_remaining updates from service_role.
    // Returns -1 if no credits left (race condition: another request got the last one).
    // Migration 021: use decrement_credits_by so the audit row carries the
    // originating generation id as ref_id (reason='generation').
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creditsAfter, error: rpcErr } = await (serviceSupabase as any)
      .rpc('decrement_credits_by', {
        p_user_id: user.id,
        p_amount: 1,
        p_reason: 'generation',
        p_ref_id: generationId,
      })

    if (rpcErr) {
      console.error('Credit decrement RPC error:', rpcErr)
      return err('Ошибка списания кредита. Попробуйте снова.', 500)
    }

    if (creditsAfter === -1) {
      // Race: another concurrent request used the last credit first
      return err(
        'Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».',
        402
      )
    }

    // ── 8. Load model image ───────────────────────────────────────────────────
    let modelImageBuffer: Buffer | undefined
    let modelMimeType:    string | undefined

    if (isMacroShot) {
      // no model image needed
    } else if (isCustomModel) {
      const { data: profileCustom } = await supabase
        .from('profiles')
        .select('custom_model_urls')
        .eq('id', user.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modelRefs: string[] = (profileCustom as any)?.custom_model_urls ?? []
      const customIndex     = getCustomModelIndex(rawModelId!)
      const customModelRef  = customIndex >= 0 ? (modelRefs[customIndex] ?? null) : null

      if (customModelRef) {
        const customModel = await downloadCustomModel(serviceSupabase, user.id, customModelRef)
        if (customModel) {
          modelImageBuffer = customModel.buffer
          modelMimeType = customModel.mimeType
        } else {
          console.warn(`User ${user.id}: custom model image unavailable`)
        }
      }
    } else if (modelId && modelPhoto && modelPhoto.renderMode !== 'prompt-only') {
      const modelPath  = path.join(process.cwd(), 'public', 'models', modelPhoto.filename)
      console.log(`[Generate] loading model photo: ${modelPath}`)
      try {
        modelImageBuffer = await fs.readFile(modelPath)
        modelMimeType    = modelPhoto.filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
      } catch (e) {
        console.error(`[Generate] model photo read failed (${modelPath}):`, e)
        await refundByWithRetry(
          serviceSupabase,
          user.id,
          1,
          'refund_generation',
          generationId,
          'Generate/ModelFileRead',
        )
        await serviceSupabase
          .from('generations')
          .update({ status: 'failed', error_message: 'Файл шаблона недоступен.' } as never)
          .eq('id', generationId)
        return err('Шаблон временно недоступен. Попробуйте другой шаблон или обновите страницу.', 500)
      }
    }

    // ── 8b. Load card template image ─────────────────────────────────────────
    let cardTemplateBuffer: Buffer | undefined
    let cardTemplateMime:   string | undefined

    if (cardTemplateId && !isCardFree) {
      const tpl = cardTemplateMeta
      if (tpl) {
        try {
          // MED-2: validate path format with strict regex BEFORE joining/decoding.
          // Rejects double-encoding attacks like /exCardTemplate/..%252f../etc/passwd.
          // Allowed: /exCardTemplate/<filename> where filename contains safe chars only.
          const TEMPLATE_PATH_REGEX = /^\/exCardTemplate\/[a-zA-Z0-9_()\-. %]+\.(webp|jpg|jpeg|png)$/
          if (!TEMPLATE_PATH_REGEX.test(tpl.image_url)) {
            console.warn(`Card template has invalid image_url format: ${cardTemplateId}`)
            throw new Error('invalid path format')
          }
          // Safe to decode and join now that format is validated
          const tplRelPath = decodeURIComponent(tpl.image_url)
          const tplAbsPath = path.join(process.cwd(), 'public', tplRelPath)
          const allowedDir = path.join(process.cwd(), 'public', 'exCardTemplate')
          if (!tplAbsPath.startsWith(allowedDir + path.sep) && !tplAbsPath.startsWith(allowedDir + '/')) {
            console.warn(`Card template path outside allowed dir: ${cardTemplateId}`)
            throw new Error('invalid path')
          }
          cardTemplateBuffer = await fs.readFile(tplAbsPath)
          const ext = tplRelPath.split('.').pop()?.toLowerCase() ?? 'webp'
          cardTemplateMime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                           : ext === 'png'                   ? 'image/png'
                           :                                   'image/webp'
        } catch {
          console.warn(`Card template image not found: ${cardTemplateId}`)
        }
      }
    }

    // ── 8c. Load custom card template from user upload ────────────────────────
    if (rawTemplateId === CUSTOM_CARD_TEMPLATE_ID && !cardTemplateBuffer) {
      const customTplFile = formData.get('custom_template') as File | null
      if (customTplFile && customTplFile.size > 0 && customTplFile.size <= MAX_IMAGE_BYTES) {
        const customTplBytes = await customTplFile.arrayBuffer()
        try {
          assertSafeImageBytes(new Uint8Array(customTplBytes))
          cardTemplateBuffer = Buffer.from(customTplBytes)
          const ext = customTplFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
          cardTemplateMime = ext === 'png'  ? 'image/png'
                           : ext === 'webp' ? 'image/webp'
                           :                  'image/jpeg'
        } catch {
          console.warn('[Generate] custom_template failed image validation')
        }
      }
    }

    // ── 9. Enqueue AI job and wait for result ────────────────────────────────
    const aiParams: GenerationParams = {
      imageUrl:           signedData.signedUrl,
      modelImageBuffer,
      modelMimeType,
      productType,
      userPrompt:         userPrompt || undefined,
      modelSubjectType:   modelPhoto?.subjectType,
      modelPose:          modelPhoto?.pose,
      modelPromptHint:    modelPhoto?.promptHint,
      isPromptOnlyTemplate: modelPhoto?.renderMode === 'prompt-only' || undefined,
      isMacroShot:        isMacroShot    || undefined,
      isContactSheet:     isContactSheet || undefined,
      contactSheetRatio:  isContactSheet ? contactSheetRatio : undefined,
      isCardFree:         isCardFree        || undefined,
      isFreeLifestyle:    isFreeLifestyle   || undefined,
      cardTemplateBuffer,
      cardTemplateMime,
      cardProductName:    (isCardFree || cardTemplateId) ? rawProductName : undefined,
      cardBrandName:      (isCardFree || cardTemplateId) ? rawBrandName   : undefined,
      cardProductDesc:    (isCardFree || cardTemplateId) ? rawProductDesc : undefined,
    }

    const finalizeMeta: FinalizeGenerateJobMeta = {
      kind: 'generate-image',
      generationId,
      userId: user.id,
      isContactSheet,
      creditsRemaining: creditsAfter,
    }

    const queuedJob = aiQueue.enqueue({
      userId:     user.id,
      providerId: 'gemini',
      type:       'image',
      priority:   getGenerationQueuePriority(profile.plan),
      params:     aiParams,
      meta:       finalizeMeta,
      maxAttempts: 1,
    })

    await serviceSupabase
      .from('generations')
      .update({
        metadata: {
          ...initialMetadata,
          async_job_id: queuedJob.id,
          credits_remaining_after_enqueue: creditsAfter,
        },
      } as never)
      .eq('id', generationId)

    const quickJob = await aiQueue.waitForJob(queuedJob.id, 1_500)
    if (quickJob.status === 'completed' || quickJob.status === 'failed') {
      const finalized = await finalizeGenerateJob(quickJob, finalizeMeta)
      if (finalized.status !== 'completed') {
        const safeErrMsg = finalized.error ?? 'Ошибка генерации. Попробуйте снова.'
        console.error('[Generate] AI job failed:', safeErrMsg)
        return err(safeErrMsg, safeErrMsg.toLowerCase().includes('времени') ? 504 : 500)
      }

      if (finalized.isContactSheet) {
        return NextResponse.json({
          success: true,
          generationId,
          isContactSheet: true,
          panels: finalized.panels ?? [],
          sheetUrl: finalized.outputUrl ?? null,
          creditsRemaining: finalized.creditsRemaining,
        })
      }

      return NextResponse.json({
        success: true,
        generationId,
        outputUrl: finalized.outputUrl ?? null,
        creditsRemaining: finalized.creditsRemaining,
      })
    }

    after(async () => {
      try {
        const settledJob = await aiQueue.waitForJob(queuedJob.id, ASYNC_GENERATION_TIMEOUT_MS)

        if (settledJob.status === 'completed' || settledJob.status === 'failed') {
          await finalizeGenerateJob(settledJob, finalizeMeta)
          return
        }

        await failQueuedGeneration(
          generationId,
          user.id,
          'Генерация заняла слишком много времени. Попробуйте снова.',
          'Generate/AsyncWaitTimeout'
        )
      } catch (backgroundError) {
        console.error('[Generate] async finalization failed:', backgroundError)
        await failQueuedGeneration(
          generationId,
          user.id,
          'Ошибка генерации. Попробуйте снова.',
          'Generate/AsyncFinalize'
        )
      }
    })

    return NextResponse.json({
      success: true,
      queued: true,
      jobId: queuedJob.id,
      generationId,
      statusToken,
      isContactSheet,
      creditsRemaining: creditsAfter,
    }, { status: 202 })
  } catch (fatal) {
    console.error('Generate route fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function failQueuedGeneration(
  generationId: string,
  userId: string,
  message: string,
  refundReason: string
) {
  const serviceSupabase = createServiceClient()

  const { data: rowRaw } = await serviceSupabase
    .from('generations')
    .select('status')
    .eq('id', generationId)
    .eq('user_id', userId)
    .single()

  const row = rowRaw as { status: string } | null
  if (!row || row.status === 'completed' || row.status === 'failed') {
    return
  }

  await refundByWithRetry(
    serviceSupabase,
    userId,
    1,
    'refund_generation',
    generationId,
    refundReason,
  )
  await serviceSupabase
    .from('generations')
    .update({
      status: 'failed',
      error_message: message.slice(0, 200),
    } as never)
    .eq('id', generationId)
    .eq('status', row.status)
}
