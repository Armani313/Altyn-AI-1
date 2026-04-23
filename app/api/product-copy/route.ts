/**
 * POST /api/product-copy
 *
 * Generates marketplace-ready product copy from a product photo.
 * Costs 1 credit per successful text generation request.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rate-limit'
import { refundByWithRetry } from '@/lib/utils/refund'
import { assertSafeImageBytes } from '@/lib/utils/security'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  VALID_PRODUCT_TYPES,
  type ProductType,
} from '@/lib/constants'
import { sanitizePrompt, checkPrompt } from '@/lib/ai/moderation'
import {
  generateProductMarketplaceCopy,
  type ProductCopyLocale,
} from '@/lib/ai/product-copy'

export const maxDuration = 90
export const runtime = 'nodejs'

const TEXT_GENERATION_CREDITS = 1

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Необходимо авторизоваться для генерации текста.', 401)

    const rl = await checkRateLimit('product-copy', user.id, 20, 60_000)
    if (!rl.ok) {
      return err(`Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.`, 429)
    }

    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { credits_remaining: number } | null
    if (!profile) return err('Профиль пользователя не найден. Обратитесь в поддержку.', 404)
    if (profile.credits_remaining < TEXT_GENERATION_CREDITS) {
      return err('Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».', 402)
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса. Используйте multipart/form-data.', 400)
    }

    const imageFile = formData.get('image') as File | null
    const rawProductType = (formData.get('product_type') as string | null) ?? ''
    const rawLocale = ((formData.get('locale') as string | null) ?? '').toLowerCase()
    const rawUserPrompt = (formData.get('user_prompt') as string | null) ?? ''
    const rawProductName = ((formData.get('product_name') as string | null) ?? '').slice(0, 100)
    const rawBrandName = ((formData.get('brand_name') as string | null) ?? '').slice(0, 60)

    const productType: ProductType = (VALID_PRODUCT_TYPES as Set<string>).has(rawProductType)
      ? rawProductType as ProductType
      : 'jewelry'
    const locale: ProductCopyLocale = rawLocale === 'en' ? 'en' : 'ru'

    const userPrompt = sanitizePrompt(rawUserPrompt)
    if (userPrompt) {
      const mod = checkPrompt(userPrompt)
      if (!mod.safe) return err(mod.message!, 400)
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
      return err(`Файл ${(imageFile.size / 1024 / 1024).toFixed(1)} МБ превышает лимит 10 МБ.`, 413)
    }

    const fileBytes = await imageFile.arrayBuffer()
    try {
      assertSafeImageBytes(new Uint8Array(fileBytes))
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Недопустимый формат файла.', 400)
    }

    const serviceSupabase = createServiceClient()
    const creditRefId = `product-copy:${crypto.randomUUID()}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creditsAfter, error: rpcErr } = await (serviceSupabase as any)
      .rpc('decrement_credits_by', {
        p_user_id: user.id,
        p_amount: TEXT_GENERATION_CREDITS,
        p_reason: 'generation',
        p_ref_id: creditRefId,
      })

    if (rpcErr) {
      console.error('[ProductCopy] credit decrement RPC error:', rpcErr)
      return err('Ошибка списания кредита. Попробуйте снова.', 500)
    }

    if (creditsAfter === -1) {
      return err('Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».', 402)
    }

    try {
      const copy = await generateProductMarketplaceCopy({
        imageBuffer: Buffer.from(fileBytes),
        mimeType: imageFile.type,
        productType,
        locale,
        userPrompt: userPrompt || undefined,
        productName: rawProductName || undefined,
        brandName: rawBrandName || undefined,
      })

      return NextResponse.json({
        success: true,
        copy,
        creditsRemaining: creditsAfter,
      })
    } catch (copyError) {
      const message = copyError instanceof Error
        ? copyError.message
        : 'Ошибка генерации текста. Попробуйте снова.'
      console.error('[ProductCopy] AI error:', message)
      await refundByWithRetry(
        serviceSupabase,
        user.id,
        TEXT_GENERATION_CREDITS,
        'refund_generation',
        creditRefId,
        'ProductCopy/AI',
      )
      return err(message.slice(0, 200), 500)
    }
  } catch (fatal) {
    console.error('[ProductCopy] fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
