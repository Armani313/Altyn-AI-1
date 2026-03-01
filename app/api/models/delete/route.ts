/**
 * DELETE /api/models/delete
 *
 * Removes one custom model photo from the user's profile array by index.
 *
 * Request body (JSON): { index: number }  — 0-based position in custom_model_urls
 * Response: { success: true, urls: string[] }
 */

import { NextResponse }     from 'next/server'
import { createClient }     from '@/lib/supabase/server'
import { MAX_CUSTOM_MODELS } from '@/lib/constants'

export const runtime = 'nodejs'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Необходима авторизация.', 401)

    // ── Parse body ────────────────────────────────────────────────────────────
    let index: number
    try {
      const body = await request.json()
      index = Number(body.index)
    } catch {
      return err('Неверный формат запроса.', 400)
    }

    if (!Number.isInteger(index) || index < 0 || index >= MAX_CUSTOM_MODELS) {
      return err('Недопустимый индекс модели.', 400)
    }

    // ── Fetch current array ───────────────────────────────────────────────────
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('custom_model_urls')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: string[] = (profileRaw as any)?.custom_model_urls ?? []

    if (index >= current.length) {
      return err('Модель с таким индексом не найдена.', 404)
    }

    // ── Remove element at index ───────────────────────────────────────────────
    const updated = current.filter((_, i) => i !== index)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ custom_model_urls: updated } as never)
      .eq('id', user.id)

    if (updateErr) {
      console.error('Profile update error:', updateErr)
      return err('Ошибка обновления профиля.', 500)
    }

    return NextResponse.json({ success: true, urls: updated })
  } catch (fatal) {
    console.error('Model delete fatal error:', fatal)
    return err('Внутренняя ошибка сервера.', 500)
  }
}

function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
