'use client'

import { useState } from 'react'
import {
  Download, Sparkles, ImageIcon, RefreshCw, Loader2,
  AlertCircle, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox'
import { type CardTemplate, CUSTOM_CARD_TEMPLATE_ID } from '@/lib/card-templates'
import type { CardResult } from '@/lib/cards-generation-store'

export type { CardResult }

type AspectRatio = '1:1' | '4:5' | '9:16'

interface CardResultViewerProps {
  results:             CardResult[]
  templateMap:         Record<string, CardTemplate>
  aspectRatio:         AspectRatio
  onAspectRatioChange: (ratio: AspectRatio) => void
  onGenerate:          () => void
  onRetryFailed:       () => void
  canGenerate:         boolean
  selectedCount:       number
  creditsRemaining:    number | null
}

const RATIOS: { id: AspectRatio; label: string; cls: string }[] = [
  { id: '1:1',  label: '1:1',  cls: 'aspect-square' },
  { id: '4:5',  label: '4:5',  cls: 'aspect-[4/5]'  },
  { id: '9:16', label: '9:16', cls: 'aspect-[9/16]' },
]

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

// ── Display item: one card in the grid ──────────────────────────────────────

type DisplayItem =
  | { type: 'done';       key: string; imageUrl: string; thumbUrl?: string; templateId: string; panelId?: number }
  | { type: 'generating'; key: string; templateId: string }
  | { type: 'error';      key: string; templateId: string; error: string | null }

/** Expands CardResult[] into individual display cards (4 per non-custom template). */
function expandResults(results: CardResult[]): DisplayItem[] {
  return results.flatMap((r): DisplayItem[] => {
    const isSingle = r.templateId === CUSTOM_CARD_TEMPLATE_ID
    const slots    = isSingle ? 1 : 4

    if (r.status === 'done' && r.panels?.length) {
      return r.panels.map((p) => ({
        type:       'done',
        key:        `${r.templateId}-p${p.id}`,
        imageUrl:   p.url,
        thumbUrl:   p.thumbUrl,
        templateId: r.templateId,
        panelId:    p.id,
      }))
    }

    if (r.status === 'done' && r.resultUrl) {
      return [{ type: 'done', key: r.templateId, imageUrl: r.resultUrl, templateId: r.templateId }]
    }

    if (r.status === 'error') {
      return Array.from({ length: slots }, (_, i) => ({
        type:       'error',
        key:        `${r.templateId}-err-${i}`,
        templateId: r.templateId,
        error:      i === 0 ? r.error : null, // show error text only on first card
      }))
    }

    // generating
    return Array.from({ length: slots }, (_, i) => ({
      type:       'generating',
      key:        `${r.templateId}-gen-${i}`,
      templateId: r.templateId,
    }))
  })
}

// ── Single card components ───────────────────────────────────────────────────

function GeneratingCard({ aspectCls }: { aspectCls: string }) {
  return (
    <div className={`relative w-full ${aspectCls} rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-cream-50 to-rose-gold-50">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-rose-gold-300 animate-ping absolute inset-0 opacity-50" />
          <div className="w-10 h-10 rounded-full bg-rose-gold-100 flex items-center justify-center relative">
            <Sparkles className="w-4 h-4 text-rose-gold-500 animate-pulse" />
          </div>
        </div>
        <div className="w-3/5 space-y-1.5">
          {[100, 75, 50].map((w) => (
            <div key={w} className="h-1 rounded-full shimmer" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorCard({ aspectCls, error }: { aspectCls: string; error: string | null }) {
  return (
    <div className={`relative w-full ${aspectCls} rounded-2xl overflow-hidden border border-red-200 bg-red-50 shadow-card`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        {error && (
          <p className="text-xs text-red-600 text-center leading-snug">{error}</p>
        )}
      </div>
    </div>
  )
}

function DoneCard({
  aspectCls,
  imageUrl,
  thumbUrl,
  onExpand,
}: {
  aspectCls: string
  imageUrl:  string
  thumbUrl?: string
  onExpand:  () => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (isDownloading) return
    setIsDownloading(true)
    await downloadImage(imageUrl, `luminify-card-${Date.now()}`)
    setIsDownloading(false)
  }

  return (
    <div
      className={`relative w-full ${aspectCls} rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card cursor-pointer group`}
      onClick={onExpand}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl ?? imageUrl}
        alt="Карточка товара"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

      {/* Download button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDownload() }}
        disabled={isDownloading}
        className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-md text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 touch-manipulation"
      >
        {isDownloading
          ? <Loader2 className="w-3 h-3 text-rose-gold-500 animate-spin flex-shrink-0" />
          : <Download className="w-3 h-3 text-rose-gold-500 flex-shrink-0" />
        }
        {isDownloading ? 'Загрузка…' : 'Скачать'}
      </button>
    </div>
  )
}

// ── Main viewer ──────────────────────────────────────────────────────────────

export function CardResultViewer({
  results,
  aspectRatio,
  onAspectRatioChange,
  onGenerate,
  onRetryFailed,
  canGenerate,
  selectedCount,
  creditsRemaining,
}: CardResultViewerProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const isAnyGenerating = results.some((r) => r.status === 'generating')
  const hasResults      = results.length > 0
  const failedCount     = results.filter((r) => r.status === 'error').length
  const enoughCredits   = creditsRemaining == null || creditsRemaining >= selectedCount
  const currentRatio    = RATIOS.find((r) => r.id === aspectRatio)!

  const displayItems  = expandResults(results)
  const doneItems     = displayItems.filter((d): d is Extract<DisplayItem, { type: 'done' }> => d.type === 'done')
  const lightboxImages: LightboxImage[] = doneItems.map((d) => ({ url: d.imageUrl }))

  const genLabel = () => {
    if (isAnyGenerating) {
      const n = results.filter((r) => r.status === 'generating').length
      const total = n * 4
      return (
        <span className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Создаём {total} карточки…
        </span>
      )
    }
    if (!enoughCredits) {
      return (
        <span className="flex items-center gap-2.5">
          <Zap className="w-5 h-5" />
          Недостаточно кредитов
        </span>
      )
    }
    if (selectedCount === 0) {
      return (
        <span className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5" />
          Выберите шаблон
        </span>
      )
    }
    const total = selectedCount * 4
    return (
      <span className="flex items-center gap-2.5">
        <Sparkles className="w-5 h-5" />
        Создать {total} карточки
        <span className="ml-0.5 text-white/70 text-sm font-normal">
          ({selectedCount} кр.)
        </span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Aspect ratio + credits */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-cream-100 rounded-xl">
          {RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => onAspectRatioChange(ratio.id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                aspectRatio === ratio.id
                  ? 'bg-white text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {creditsRemaining != null && (
          <div className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 ${
            !enoughCredits && selectedCount > 0
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'text-muted-foreground'
          }`}>
            <Zap className={`w-3.5 h-3.5 ${!enoughCredits && selectedCount > 0 ? 'text-red-500' : 'text-rose-gold-500'}`} />
            <span>
              <strong className="text-foreground">{creditsRemaining}</strong> кредитов
            </span>
          </div>
        )}
      </div>

      {/* Generate button */}
      <Button
        onClick={onGenerate}
        disabled={!canGenerate || isAnyGenerating || selectedCount === 0 || !enoughCredits}
        className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
          canGenerate && !isAnyGenerating && selectedCount > 0 && enoughCredits
            ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {genLabel()}
      </Button>

      {/* Retry failed */}
      {failedCount > 0 && !isAnyGenerating && (
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onRetryFailed}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Повторить {failedCount === 1 ? 'неудачную' : `${failedCount} неудачных`} генераций
        </Button>
      )}

      {/* Results grid — 2 columns, each item is a standalone card */}
      {hasResults ? (
        <div className="grid grid-cols-2 gap-2.5">
          {displayItems.map((item) => {
            if (item.type === 'generating') {
              return <GeneratingCard key={item.key} aspectCls={currentRatio.cls} />
            }
            if (item.type === 'error') {
              return <ErrorCard key={item.key} aspectCls={currentRatio.cls} error={item.error} />
            }
            // done
            const lbIdx = doneItems.findIndex((d) => d.key === item.key)
            return (
              <DoneCard
                key={item.key}
                aspectCls={currentRatio.cls}
                imageUrl={item.imageUrl}
                thumbUrl={item.thumbUrl}
                onExpand={() => setLightboxIndex(lbIdx)}
              />
            )
          })}
        </div>
      ) : (
        /* Empty placeholder */
        <div className={`relative w-full ${currentRatio.cls} rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-rose-gold-50/50 via-transparent to-cream-200/30" />
            <div className="relative z-10 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cream-100 border border-cream-200 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-foreground/70 text-sm mb-0.5">
                  Здесь появятся карточки
                </p>
                <p className="text-xs text-muted-foreground">
                  Загрузите фото и выберите шаблон
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAnyGenerating && !canGenerate && selectedCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          ↑ Загрузите фото продукта для начала
        </p>
      )}

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  )
}
