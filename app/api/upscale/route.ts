/**
 * POST /api/upscale
 *
 * Upscales one panel from a contact-sheet generation to 4K using
 * Vertex AI imagen-4.0-upscale-preview (x4 factor, PNG output).
 *
 * Request: multipart/form-data
 *   generation_id  string  — ID of the completed contact-sheet generation
 *   panel_id       string  — '1' | '2' | '3' | '4'
 *
 * Response (JSON):
 *   { success: true, upscaledUrl, panelId, creditsRemaining }
 *
 * Pipeline:
 *   1. Auth + rate limit
 *   2. Credits pre-check (1 credit per upscale)
 *   3. Load panel_variants from DB, find requested panel URL (ownership check)
 *   4. Download 1K panel from Supabase → Buffer → Base64
 *   5. Atomic credit decrement
 *   6. Call Vertex AI Imagen x4 upscale → 4K PNG buffer
 *   7. Upload 4K PNG to Supabase Storage
 *   8. Update panel_variants JSONB: upscaled_url + is_upscaled: true
 *   9. Return upscaled URL
 */

import { NextResponse }       from 'next/server'
import { createClient }       from '@/lib/supabase/server'
import { createServiceClient} from '@/lib/supabase/service'
import { upscaleToFourK }     from '@/lib/ai/imagen-upscale'
import { checkRateLimit }     from '@/lib/rate-limit'
import { refundWithRetry }    from '@/lib/utils/refund'
import { UUID_REGEX }         from '@/lib/constants'
import {
  readPanelVariantsFromMetadata,
  writePanelVariantsToMetadata,
} from '@/lib/generate/panel-variants'

export const maxDuration = 120   // Imagen upscale can take up to 90s
export const runtime     = 'nodejs'

const OUTPUT_BUCKET   = 'generated-images'
const PANEL_ID_REGEX  = /^[1-4]$/   // HIGH-1: validate format before parseInt

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Необходимо авторизоваться.', 401)

    // ── 2. Rate limit (5 upscales per minute) ─────────────────────────────────
    const rl = await checkRateLimit('upscale', user.id, 5, 60_000)
    if (!rl.ok) {
      return err(`Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.`, 429)
    }

    // ── 3. Credits pre-check ──────────────────────────────────────────────────
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single()

    const profile = profileRaw as { credits_remaining: number } | null
    if (!profile) return err('Профиль не найден.', 404)
    if (profile.credits_remaining <= 0) {
      return err('Недостаточно кредитов. Пополните баланс в разделе «Настройки → Оплата».', 402)
    }

    // ── 4. Parse + validate body ──────────────────────────────────────────────
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return err('Неверный формат запроса.', 400)
    }

    const rawGenId   = (formData.get('generation_id') as string | null) ?? ''
    const rawPanelId = (formData.get('panel_id')      as string | null) ?? ''

    if (!UUID_REGEX.test(rawGenId)) return err('Неверный generation_id.', 400)

    // HIGH-1: validate format before parseInt to prevent "1a" → 1 bypass
    if (!PANEL_ID_REGEX.test(rawPanelId)) return err('panel_id должен быть 1, 2, 3 или 4.', 400)
    const panelId = parseInt(rawPanelId, 10) as 1 | 2 | 3 | 4

    // ── 5. Load generation + ownership check ──────────────────────────────────
    const { data: genRaw } = await supabase
      .from('generations')
      .select('status, metadata')
      .eq('id', rawGenId)
      .eq('user_id', user.id)   // ownership enforced at query level
      .single()

    const gen = genRaw as { status: string; metadata?: unknown } | null
    if (!gen)                               return err('Генерация не найдена.', 404)
    if (gen.status !== 'completed')         return err('Генерация ещё не завершена.', 400)
    const currentVariants = readPanelVariantsFromMetadata(gen.metadata as never)
    if (currentVariants.length === 0) return err('Это не контактный лист.', 400)

    const panelEntry = currentVariants.find((p) => p.id === panelId)
    if (!panelEntry?.url) return err(`Панель ${panelId} не найдена.`, 404)

    const panel1KUrl: string = panelEntry.url

    // ── 6. Download 1K panel from Supabase ────────────────────────────────────
    let panel1KBuffer: Buffer
    try {
      const res = await fetch(panel1KUrl, { signal: AbortSignal.timeout(30_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      panel1KBuffer = Buffer.from(await res.arrayBuffer())
    } catch (e) {
      console.error('[Upscale] panel download failed:', e)
      return err('Не удалось загрузить исходный файл. Попробуйте снова.', 500)
    }

    // ── 7. Atomic credit decrement ────────────────────────────────────────────
    const serviceSupabase = createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creditsAfter, error: rpcErr } = await (serviceSupabase as any)
      .rpc('decrement_credits', { p_user_id: user.id })

    if (rpcErr) return err('Ошибка списания кредита. Попробуйте снова.', 500)
    if (creditsAfter === -1) {
      return err('Недостаточно кредитов. Пополните баланс.', 402)
    }

    // ── 8. Vertex AI Imagen x4 upscale ────────────────────────────────────────
    let upscaledBuffer: Buffer
    try {
      const result   = await upscaleToFourK(panel1KBuffer)
      upscaledBuffer = result.imageBuffer
    } catch (upscaleErr) {
      const msg = upscaleErr instanceof Error
        ? upscaleErr.message
        : 'Ошибка апскейла. Попробуйте снова.'
      console.error('[Upscale] Vertex AI error:', upscaleErr)
      // HIGH-2: retry refund up to 3 times to prevent permanent credit loss
      await refundWithRetry(serviceSupabase, user.id, 'Upscale/AI')
      return err(msg.slice(0, 200), 500)
    }

    // ── 9. Upload 4K PNG to Supabase Storage ──────────────────────────────────
    const upscaledPath = `${user.id}/${rawGenId}-panel-${panelId}-4k.png`

    const { error: uploadErr } = await serviceSupabase.storage
      .from(OUTPUT_BUCKET)
      .upload(upscaledPath, upscaledBuffer, { contentType: 'image/png', upsert: true })

    if (uploadErr) {
      console.error('[Upscale] storage upload error:', uploadErr)
      // HIGH-2: retry refund up to 3 times to prevent permanent credit loss
      await refundWithRetry(serviceSupabase, user.id, 'Upscale/Upload')
      return err('Ошибка сохранения 4K файла. Попробуйте снова.', 500)
    }

    const { data: upscaledPub } = serviceSupabase.storage
      .from(OUTPUT_BUCKET)
      .getPublicUrl(upscaledPath)
    const upscaledUrl = upscaledPub.publicUrl

    // ── 10. Update panel_variants in metadata ─────────────────────────────────
    // CRITICAL-1 fix: always filter by user_id to prevent cross-user writes.
    // LOGIC-1 note: concurrent upscales of different panels on the same generation
    // carry a lost-update risk; a Postgres JSONB function would be ideal, but for
    // the current load (upscale is UI-hidden) this read-modify-write is acceptable.
    const updatedVariants = currentVariants.map((p) =>
      p.id === panelId
        ? { ...p, is_upscaled: true, upscaled_url: upscaledUrl }
        : p
    )

    const { error: updateErr } = await supabase
      .from('generations')
      .update({
        metadata: writePanelVariantsToMetadata(gen.metadata as never, updatedVariants),
      } as never)
      .eq('id', rawGenId)
      .eq('user_id', user.id)   // CRITICAL-1: ownership guard on UPDATE

    if (updateErr) {
      console.error('[Upscale] metadata panel_variants update error:', updateErr)
      // Image is uploaded but record not updated — non-fatal, upscaled URL is returned
    }

    return NextResponse.json({
      success:          true,
      upscaledUrl,
      panelId,
      creditsRemaining: creditsAfter,
    })
  } catch (fatal) {
    console.error('[Upscale] fatal error:', fatal)
    return err('Внутренняя ошибка сервера. Попробуйте позже.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
