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
import { createClient } from '@/lib/supabase/server'
import { generateJewelryPhoto } from '@/lib/ai/replicate'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, SAFE_IMAGE_EXTENSIONS } from '@/lib/constants'

// Extend serverless timeout to 60 s for the Replicate polling step
export const maxDuration = 60
export const runtime = 'nodejs'

// ── Constants ─────────────────────────────────────────────────────────────────

const INPUT_BUCKET  = 'jewelry-uploads'
const OUTPUT_BUCKET = 'generated-images'

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

    const imageFile      = formData.get('image') as File | null
    const templateId     = (formData.get('template_id') as string | null) || null
    const templateCategory = (formData.get('template_category') as string) || 'rings'
    const aspectRatio    = (formData.get('aspect_ratio') as string) || '1:1'

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

    // ── 6. Call AI provider ───────────────────────────────────────────────────
    let aiOutputUrl: string
    try {
      const result = await generateJewelryPhoto({
        imageUrl:         signedData.signedUrl,
        templateCategory,
        promptStrength:   0.55,
      })
      aiOutputUrl = result.outputUrl
    } catch (aiErr) {
      await supabase
        .from('generations')
        .update({ status: 'failed', error_message: String(aiErr) } as never)
        .eq('id', generationId)

      console.error('AI generation error:', aiErr)
      return err(
        aiErr instanceof Error
          ? aiErr.message
          : 'Ошибка генерации. Попробуйте снова или выберите другой шаблон.',
        500
      )
    }

    // ── 7. Download AI result and re-upload to our Storage ────────────────────
    // Storing on our infrastructure prevents expiring Replicate URLs
    const outputPath     = `${user.id}/${generationId}-result.jpg`
    let resultPublicUrl  = aiOutputUrl // fallback to direct Replicate URL

    try {
      const aiResponse = await fetch(aiOutputUrl, { signal: AbortSignal.timeout(30_000) })
      if (aiResponse.ok) {
        const resultBytes = await aiResponse.arrayBuffer()
        const { error: resultUploadErr } = await supabase.storage
          .from(OUTPUT_BUCKET)
          .upload(outputPath, resultBytes, { contentType: 'image/jpeg', upsert: true })

        if (!resultUploadErr) {
          const { data: pub } = supabase.storage.from(OUTPUT_BUCKET).getPublicUrl(outputPath)
          resultPublicUrl = pub.publicUrl
        }
      }
    } catch (downloadErr) {
      // Non-critical: Replicate URL is still valid for ~1 h
      console.warn('Result re-upload skipped:', downloadErr)
    }

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
