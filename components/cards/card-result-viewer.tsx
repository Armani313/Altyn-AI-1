'use client'

import { useState } from 'react'
import {
  Download, Sparkles, ImageIcon, RefreshCw, Loader2,
  AlertCircle, Zap, Maximize2, LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox'
import { CARD_TEMPLATE_MAP, CUSTOM_CARD_TEMPLATE_ID } from '@/lib/card-templates'

type AspectRatio = '1:1' | '4:5' | '9:16'

export interface CardResult {
  templateId: string
  status:     'generating' | 'done' | 'error'
  resultUrl:  string | null
  error:      string | null
}

interface CardResultViewerProps {
  results:             CardResult[]
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

function CardResultCard({
  result,
  aspectCls,
  onExpand,
}: {
  result:     CardResult
  aspectCls:  string
  onExpand?:  () => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const isCustom  = result.templateId === CUSTOM_CARD_TEMPLATE_ID
  const template  = isCustom ? null : CARD_TEMPLATE_MAP[result.templateId]

  const handleDownload = async () => {
    if (!result.resultUrl || isDownloading) return
    setIsDownloading(true)
    await downloadImage(result.resultUrl, `nurai-card-${result.templateId}-${Date.now()}`)
    setIsDownloading(false)
  }

  return (
    <div className={`relative w-full ${aspectCls} rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card`}>

      {/* Generating */}
      {result.status === 'generating' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-cream-50 to-rose-gold-50">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-rose-gold-300 animate-ping absolute inset-0 opacity-50" />
            <div className="w-12 h-12 rounded-full bg-rose-gold-100 flex items-center justify-center relative">
              <Sparkles className="w-5 h-5 text-rose-gold-500 animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium px-4 text-center">
            ИИ создаёт карточку…
          </p>
          <div className="w-3/5 space-y-1.5">
            {[100, 75, 50].map((w) => (
              <div key={w} className="h-1 rounded-full shimmer" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {result.status === 'done' && result.resultUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.resultUrl}
            alt="Карточка товара"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-md text-foreground text-xs font-semibold px-3 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 touch-manipulation"
          >
            {isDownloading
              ? <Loader2 className="w-3.5 h-3.5 text-rose-gold-500 animate-spin flex-shrink-0" />
              : <Download className="w-3.5 h-3.5 text-rose-gold-500 flex-shrink-0" />
            }
            {isDownloading ? 'Загрузка…' : 'Скачать'}
          </button>

          {onExpand && (
            <button
              onClick={onExpand}
              className="absolute bottom-2 left-2 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
              aria-label="Открыть полноэкранно"
            >
              <Maximize2 className="w-3.5 h-3.5 text-foreground/70" />
            </button>
          )}
        </>
      )}

      {/* Error */}
      {result.status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 bg-red-50">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-600 text-center leading-snug">
            {result.error ?? 'Ошибка генерации'}
          </p>
        </div>
      )}

      {/* Template badge */}
      {isCustom ? (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <LayoutGrid className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-[10px] text-white font-medium">Мой шаблон</span>
        </div>
      ) : template && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: template.dotColor }}
          />
          <span className="text-[10px] text-white font-medium truncate max-w-[90px]">
            {template.name}
          </span>
        </div>
      )}
    </div>
  )
}

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

  const lightboxImages: LightboxImage[] = results
    .filter((r) => r.status === 'done' && r.resultUrl)
    .map((r) => ({ url: r.resultUrl! }))

  function doneIndexOf(result: CardResult): number {
    return lightboxImages.findIndex((img) => img.url === result.resultUrl)
  }

  const genLabel = () => {
    if (isAnyGenerating) {
      const n = results.filter((r) => r.status === 'generating').length
      return (
        <span className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Создаём {n} {n === 1 ? 'карточку' : 'карточки'}…
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
    return (
      <span className="flex items-center gap-2.5">
        <Sparkles className="w-5 h-5" />
        {selectedCount === 1 ? 'Создать карточку' : `Создать ${selectedCount} карточки`}
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

      {/* Results grid */}
      {hasResults ? (
        <div className={`grid gap-3 ${results.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {results.map((result) => (
            <CardResultCard
              key={result.templateId}
              result={result}
              aspectCls={currentRatio.cls}
              onExpand={
                result.status === 'done' && result.resultUrl
                  ? () => setLightboxIndex(doneIndexOf(result))
                  : undefined
              }
            />
          ))}
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
