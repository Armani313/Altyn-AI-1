'use client'

import { useState } from 'react'
import { Download, Maximize2, Calendar, ImageIcon } from 'lucide-react'
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox'
import type { Generation } from '@/types/database.types'

// ── Status badge mapping ───────────────────────────────────────
const STATUS_MAP: Record<Generation['status'], { label: string; class: string }> = {
  pending:    { label: 'В очереди',  class: 'bg-amber-50 text-amber-600 border-amber-200' },
  processing: { label: 'Создаётся', class: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed:  { label: 'Готово',    class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  failed:     { label: 'Ошибка',    class: 'bg-red-50 text-red-600 border-red-200' },
}

async function downloadImage(url: string, name: string) {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
    const tmp  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = tmp
    a.download = `${name}.${ext}`
    a.click()
    URL.revokeObjectURL(tmp)
  } catch {
    window.open(url, '_blank')
  }
}

interface LibraryGridProps {
  generations: Generation[]
}

export function LibraryGrid({ generations }: LibraryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Build lightbox image list from completed generations only
  const lightboxImages: LightboxImage[] = generations
    .filter((g) => g.status === 'completed' && g.output_image_url)
    .map((g) => ({
      url:   g.output_image_url!,
      label: new Date(g.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
    }))

  // Map a generation's index in the full list to its index in lightboxImages
  function toLightboxIndex(gen: Generation): number {
    return lightboxImages.findIndex((img) => img.url === gen.output_image_url)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {generations.map((gen) => {
          const status    = STATUS_MAP[gen.status]
          const date      = new Date(gen.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
          const lbIndex   = gen.output_image_url ? toLightboxIndex(gen) : -1
          const canExpand = gen.status === 'completed' && gen.output_image_url && lbIndex >= 0

          return (
            <div
              key={gen.id}
              className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-soft hover:shadow-card hover:border-rose-gold-100 transition-all duration-300"
            >
              {/* Image area */}
              <div className="aspect-square bg-gradient-to-br from-cream-100 to-rose-gold-50 flex items-center justify-center relative overflow-hidden">
                {gen.output_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gen.output_image_url}
                    alt="Сгенерированное изображение"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-3">
                    <div className="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {gen.status === 'processing' ? 'Создаётся...' : 'Нет изображения'}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer: status + date + action buttons */}
              <div className="p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${status.class}`}>
                    {status.label}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px]">{date}</span>
                  </div>
                </div>

                {/* Action buttons — always visible */}
                {gen.output_image_url && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => downloadImage(gen.output_image_url!, `nurai-${gen.id.slice(0, 8)}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-cream-100 hover:bg-rose-gold-50 hover:text-rose-gold-700 text-foreground/70 text-[10px] font-semibold py-2.5 rounded-lg transition-colors touch-manipulation"
                      aria-label="Скачать"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Скачать
                    </button>

                    {canExpand && (
                      <button
                        onClick={() => setLightboxIndex(lbIndex)}
                        className="w-10 flex items-center justify-center bg-cream-100 hover:bg-rose-gold-50 hover:text-rose-gold-700 text-foreground/70 rounded-lg transition-colors touch-manipulation"
                        aria-label="Открыть полноэкранно"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  )
}
