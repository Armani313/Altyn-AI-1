/**
 * POST /api/generate
 *
 * Full AI generation pipeline for jewelry lifestyle photos.
 *
 * Request: multipart/form-data
 *   image             File    — jewelry photo (JPG/PNG/WebP/HEIC, max 10 MB)
 *   template_id       string? — template UUID from the templates table
 *   template_category string? — 'rings' | 'necklaces' | 'earrings' | 'bracelets'
 *   aspect_ratio      string? — '1:1' | '9:16'  (default: '1:1')
 *
 * Response (JSON):
 *   { success: true, generationId, outputUrl, creditsRemaining }
 *
 * Pipeline:
 *   1.  Auth check
 *   2.  Credits pre-check (fast fail before any I/O)
 *   3.  Validate & parse multipart body
 *   4.  Upload source image → Supabase Storage (jewelry-uploads/)
 *   5.  Create "processing" generation record
 *   6.  Call Replicate API (image-to-image)
 *   7.  Download AI result → re-upload to Storage (generated-images/)
 *   8.  Mark generation as "completed"
 *   9.  Atomic credit decrement via DB function
 *   10. Return result
 *
 * All errors returned in professional Russian.
 */

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateJewelryPhoto } from '@/lib/ai/gemini'
import {
  ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS,
  MODEL_PHOTO_MAP, VALID_MODEL_IDS, VALID_PRODUCT_TYPES,
  isCustomModelId, getCustomModelIndex,
  type ProductType,
} from '@/lib/constants'
import { sanitizePrompt, checkPrompt } from '@/lib/ai/moderation'

// Extend serverless timeout to 60 s for Gemini generation
export const maxDuration = 60
export const runtime = 'nodejs'

// ── Constants ─────────────────────────────────────────────────────────────────

const INPUT_BUCKET  = 'jewelry-uploads'
const OUTPUT_BUCKET = 'generated-images'

// HIGH-5: strict allowlists for user-controlled inputs
const VALID_CATEGORIES = ['rings', 'necklaces', 'earrings', 'bracelets', 'universal'] as const
const VALID_RATIOS     = ['1:1', '9:16'] as const
const UUID_REGEX       = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return err('Необходимо авторизоваться для генерации изображений.', 401)
    }

    // ── 2. Credits pre-check ─────────────────────────────────────────────────
    // Non-atomic fast fail — actual deduction at step 9 is atomic.
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('credits_remaining, plan')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { credits_remaining: number; plan: string } | null

    if (!profile) {
      return err('Профиль пользователя не найден. Обратитесь в поддержку.', 404)
    }

    if (profile.credits_remaining <= 0) {
      return err(
        'Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».',
        402
      )
    }

    // ── 3. Parse multipart body ───────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса. Используйте multipart/form-data.', 400)
    }

    const imageFile = formData.get('image') as File | null

    // HIGH-5: validate all user-controlled fields against strict allowlists
    const rawTemplateId  = (formData.get('template_id') as string | null) || null
    const rawCategory    = (formData.get('template_category') as string) || ''
    const rawRatio       = (formData.get('aspect_ratio') as string) || ''
    const rawModelId     = (formData.get('model_id') as string | null) || null
    const rawProductType = (formData.get('product_type') as string) || ''
    const rawUserPrompt  = (formData.get('user_prompt') as string | null) || ''

    // Moderation: sanitize + check user prompt before any heavy I/O
    const userPrompt = sanitizePrompt(rawUserPrompt)
    if (userPrompt) {
      const mod = checkPrompt(userPrompt)
      if (!mod.safe) return err(mod.message!, 400)
    }

    const templateId = rawTemplateId !== null
      ? (UUID_REGEX.test(rawTemplateId) ? rawTemplateId : null)
      : null

    const templateCategory = (VALID_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory
      : 'rings'

    const aspectRatio = (VALID_RATIOS as readonly string[]).includes(rawRatio)
      ? rawRatio as '1:1' | '9:16'
      : '1:1'

    // Validate model_id: allow static allowlist OR user-custom-N pattern
    const isCustomModel = rawModelId !== null && isCustomModelId(rawModelId)
    const modelId = isCustomModel
      ? null
      : (rawModelId && VALID_MODEL_IDS.has(rawModelId) ? rawModelId : null)

    // Validate product_type against allowlist
    const productType: ProductType = (VALID_PRODUCT_TYPES as Set<string>).has(rawProductType)
      ? rawProductType as ProductType
      : 'jewelry'

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
        `Файл ${(imageFile.size / 1024 / 1024).toFixed(1)} МБ превышает лимит 10 МБ. ` +
        'Сожмите изображение и попробуйте снова.',
        413
      )
    }

    // ── 4. Upload source image ────────────────────────────────────────────────
    const rawExt    = imageFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeExt   = (SAFE_IMAGE_EXTENSIONS as readonly string[]).includes(rawExt) ? rawExt : 'jpg'
    const inputPath = `${user.id}/${Date.now()}-source.${safeExt}`
    const fileBytes = await imageFile.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from(INPUT_BUCKET)
      .upload(inputPath, fileBytes, { contentType: imageFile.type, upsert: false })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return err('Ошибка загрузки файла. Проверьте соединение и попробуйте снова.', 500)
    }

    // Signed URL valid for 1 h — long enough for Replicate to fetch the image
    const { data: signedData } = await supabase.storage
      .from(INPUT_BUCKET)
      .createSignedUrl(inputPath, 3600)

    if (!signedData?.signedUrl) {
      return err('Не удалось получить доступ к загруженному файлу.', 500)
    }

    // ── 5. Create "processing" generation record ──────────────────────────────
    const { data: genRaw, error: genInsertErr } = await supabase
      .from('generations')
      .insert({
        user_id:         user.id,
        template_id:     templateId,
        input_image_url: inputPath,
        status:          'processing',
        metadata: {
          aspect_ratio:      aspectRatio,
          template_category: templateCategory,
          model_id:          modelId ?? null,
          product_type:      productType,
        },
      } as never)
      .select('id')
      .single()

    const gen = genRaw as { id: string } | null

    if (genInsertErr || !gen?.id) {
      console.error('Generation insert error:', genInsertErr)
      return err('Ошибка создания задания. Попробуйте снова.', 500)
    }

    const generationId = gen.id

    // ── 6. Call Gemini ────────────────────────────────────────────────────────
    // If a model was selected, read it from the local public/ folder (safe — path
    // is derived from a compile-time allowlist, never from raw user input).
    let modelImageBuffer: Buffer | undefined
    let modelMimeType:    string | undefined

    if (isCustomModel) {
      // Load custom model from user's profile array
      const { data: profileCustom } = await supabase
        .from('profiles')
        .select('custom_model_urls')
        .eq('id', user.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const urls: string[] = (profileCustom as any)?.custom_model_urls ?? []
      const customIndex = getCustomModelIndex(rawModelId!)
      const customUrl = urls[customIndex] ?? null

      if (customUrl) {
        try {
          const modelRes = await fetch(customUrl, { signal: AbortSignal.timeout(30_000) })
          if (modelRes.ok) {
            modelImageBuffer = Buffer.from(await modelRes.arrayBuffer())
            modelMimeType    = modelRes.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg'
          }
        } catch {
          // Custom model image unavailable — fall through to standalone mode
          console.warn(`User ${user.id}: failed to fetch custom model image`)
        }
      }
    } else if (modelId) {
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
        productType,
        userPrompt:       userPrompt || undefined,
      })
      aiImageBuffer = result.imageBuffer
      aiMimeType    = result.mimeType
    } catch (aiErr) {
      // HIGH-4: store only a safe user-facing message, never a raw exception string
      const safeErrMsg = aiErr instanceof Error
        ? aiErr.message.slice(0, 200)
        : 'Ошибка генерации.'
      await supabase
        .from('generations')
        .update({ status: 'failed', error_message: safeErrMsg } as never)
        .eq('id', generationId)

      console.error('AI generation error:', aiErr)
      return err(
        aiErr instanceof Error
          ? aiErr.message
          : 'Ошибка генерации. Попробуйте снова или выберите другой шаблон.',
        500
      )
    }

    // ── 7. Upload Gemini result to our Storage ────────────────────────────────
    // Use service-role client to bypass RLS — server-side operation, safe.
    const serviceSupabase = createServiceClient()
    const ext        = aiMimeType === 'image/png' ? 'png' : 'jpg'
    const outputPath = `${user.id}/${generationId}-result.${ext}`
    let resultPublicUrl = ''

    const { error: resultUploadErr } = await serviceSupabase.storage
      .from(OUTPUT_BUCKET)
      .upload(outputPath, aiImageBuffer, { contentType: aiMimeType, upsert: true })

    if (resultUploadErr) {
      console.error('Result upload error:', resultUploadErr)
      return err('Ошибка сохранения результата. Попробуйте снова.', 500)
    }

    const { data: pub } = serviceSupabase.storage.from(OUTPUT_BUCKET).getPublicUrl(outputPath)
    resultPublicUrl = pub.publicUrl

    // ── 8. Mark generation as completed ──────────────────────────────────────
    await supabase
      .from('generations')
      .update({ status: 'completed', output_image_url: resultPublicUrl } as never)
      .eq('id', generationId)

    // ── 9. Atomic credit decrement ────────────────────────────────────────────
    // Uses a DB function that does UPDATE ... WHERE credits_remaining > 0 RETURNING
    // Returns -1 if credits ran out between our pre-check and now (concurrent request)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creditsAfter, error: rpcErr } = await (supabase as any)
      .rpc('decrement_credits', { p_user_id: user.id })

    if (rpcErr) {
      // Non-fatal: generation succeeded, just log the accounting issue
      console.error('Credit decrement RPC error:', rpcErr)
    }

    if (creditsAfter === -1) {
      // Edge case: another request used the last credit concurrently
      console.warn(`User ${user.id}: concurrent request used last credit`)
    }

    // ── 10. Return success ────────────────────────────────────────────────────
    return NextResponse.json({
      success:          true,
      generationId,
      outputUrl:        resultPublicUrl,
      creditsRemaining: creditsAfter ?? Math.max(0, profile.credits_remaining - 1),
    })
  } catch (fatal) {
    console.error('Generate route fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
