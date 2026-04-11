import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import type { VideoTemplate } from '@/types/database.types'
import type { VideoTemplateListItem } from '@/lib/video/types'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Необходимо авторизоваться.' }, { status: 401 })
  }

  const rl = await checkRateLimit('video-templates', user.id, 30, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Слишком много запросов. Повторите через ${rl.retryAfterSec} сек.` },
      { status: 429 }
    )
  }

  const { data, error } = await supabase
    .from('video_templates')
    .select('id, name, description, cover_image_url, demo_video_url, aspect_ratio, label, is_premium')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[video-templates] DB error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки видео-шаблонов.' }, { status: 500 })
  }

  const templates = (data ?? []) as VideoTemplate[]

  const result: VideoTemplateListItem[] = templates.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    coverImageUrl: template.cover_image_url,
    demoVideoUrl: template.demo_video_url,
    aspectRatio: template.aspect_ratio,
    label: template.label,
    premium: template.is_premium,
  }))

  return NextResponse.json(result)
}
