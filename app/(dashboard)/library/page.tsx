import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wand2, Download, Calendar, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import type { Generation } from '@/types/database.types'

export const metadata = { title: 'Библиотека' }

// ── Status badge mapping ──────────────────────────────────────
const STATUS_MAP: Record<
  Generation['status'],
  { label: string; class: string }
> = {
  pending:    { label: 'В очереди',  class: 'bg-amber-50 text-amber-600 border-amber-200' },
  processing: { label: 'Создаётся', class: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed:  { label: 'Готово',    class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  failed:     { label: 'Ошибка',    class: 'bg-red-50 text-red-600 border-red-200' },
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', user.id)
    .single()

  // INFO-3: select only the fields the UI actually needs —
  // avoids exposing input_image_url, raw error_message, and full metadata.
  const { data: generationsRaw } = await supabase
    .from('generations')
    .select('id, status, output_image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(48)

  const items = (generationsRaw ?? []) as Generation[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Библиотека"
        subtitle="Все ваши сгенерированные изображения"
        profile={profile}
      />

      <div className="flex-1 p-5 xl:p-6">
        <div className="max-w-6xl mx-auto">

          {/* ── Empty state ──────────────────────────────── */}
          {items.length === 0 && <EmptyState />}

          {/* ── Grid ─────────────────────────────────────── */}
          {items.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{items.length}</strong> изображений
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {items.map((gen) => (
                  <GenerationCard key={gen.id} generation={gen} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Generation card ───────────────────────────────────────────
function GenerationCard({ generation }: { generation: Generation }) {
  const status = STATUS_MAP[generation.status]
  const date = new Date(generation.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div className="group relative bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-soft hover:shadow-card hover:border-rose-gold-100 transition-all duration-300">
      {/* Image area */}
      <div className="aspect-square bg-gradient-to-br from-cream-100 to-rose-gold-50 flex items-center justify-center relative overflow-hidden">
        {generation.output_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={generation.output_image_url}
            alt="Сгенерированное изображение"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-3">
            <div className="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {generation.status === 'processing'
                ? 'Создаётся...'
                : 'Нет изображения'}
            </span>
          </div>
        )}

        {/* Download overlay */}
        {generation.output_image_url && (
          <a
            href={generation.output_image_url}
            download={`nurai-${generation.id.slice(0, 8)}.jpg`}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors duration-300"
          >
            <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
              <Download className="w-4 h-4 text-foreground" />
            </div>
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${status.class}`}
          >
            {status.label}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px]">{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Decorative gradient orb */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-gold-200 to-rose-gold-300 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-rose-gold-600" />
          </div>
        </div>
        {/* Sparkle dots */}
        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-rose-gold-300 opacity-70" />
        <div className="absolute bottom-2 left-0 w-2 h-2 rounded-full bg-rose-gold-200" />
      </div>

      <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
        Библиотека пуста
      </h2>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
        Здесь будут храниться все ваши сгенерированные лайфстайл-фотографии.
        Создайте первую прямо сейчас!
      </p>

      <Link href="/dashboard">
        <Button className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 h-11 px-6">
          <Wand2 className="w-4 h-4 mr-2" />
          Создать первое фото
        </Button>
      </Link>
    </div>
  )
}
