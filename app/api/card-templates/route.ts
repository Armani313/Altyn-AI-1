/**
 * GET /api/card-templates
 *
 * Returns the list of active card templates from the database.
 * Requires authentication.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 10
export const runtime     = 'nodejs'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // HIGH-3: rate limit — 30 requests per minute per user
  const rl = await checkRateLimit('card-templates', user.id, 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.` },
      { status: 429 }
    )
  }

  const { data, error } = await supabase
    .from('card_templates')
    .select('id, name, category, image_url, label, is_premium')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[card-templates] DB error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки шаблонов.' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates = (data ?? []) as any[]

  return NextResponse.json(
    templates.map((t) => ({
      id:        t.id       as string,
      name:      t.name     as string,
      category:  t.category as string,
      imageUrl:  t.image_url as string,
      label:     t.label    as string | undefined,
      premium:   t.is_premium as boolean,
    }))
  )
}
