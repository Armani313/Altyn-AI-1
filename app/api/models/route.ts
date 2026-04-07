import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkRateLimit } from '@/lib/rate-limit'
import { buildSignedCustomModelUrls } from '@/lib/custom-models'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация.' }, { status: 401 })
    }

    const rl = await checkRateLimit('models-list', user.id, 30, 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.` },
        { status: 429 },
      )
    }

    const { data: profileRaw, error } = await supabase
      .from('profiles')
      .select('custom_model_urls')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Custom models list error:', error)
      return NextResponse.json({ error: 'Не удалось загрузить модели.' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storedValues: string[] = (profileRaw as any)?.custom_model_urls ?? []
    const serviceSupabase = createServiceClient()
    const urls = await buildSignedCustomModelUrls(serviceSupabase, user.id, storedValues)

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('Custom models GET fatal error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера.' }, { status: 500 })
  }
}
