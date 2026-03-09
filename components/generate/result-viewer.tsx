'use client'

import { useState } from 'react'
import { Download, Sparkles, ImageIcon, RefreshCw, Loader2, AlertCircle, Zap, Maximize2, ChevronDown, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox'
import { MODEL_PHOTO_MAP, isCustomModelId, getCustomModelIndex } from '@/lib/constants'

type AspectRatio = '1:1' | '9:16'

export interface GenerationResult {
  modelId:   string
  status:    'generating' | 'done' | 'error'
  resultUrl: string | null
  error:     string | null
}

interface ResultViewerProps {
  results:             GenerationResult[]
  aspectRatio:         AspectRatio
  onAspectRatioChange: (ratio: AspectRatio) => void
  onGenerate:          () => void
  onRetryFailed:       () => void
  canGenerate:         boolean
  selectedCount:       number
  creditsRemaining:    number | null
  /** URLs of the user's custom models — used for thumbnails in result cards */
  customModelUrls?:    string[]
  userPrompt:          string
  onUserPromptChange:  (v: string) => void
}

const RATIOS: { id: AspectRatio; label: string; cls: string }[] = [
  { id: '1:1',  label: '1:1 Пост',    cls: 'aspect-square'  },
  { id: '9:16', label: '9:16 Сторис', cls: 'aspect-[9/16]'  },
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

/* ── Single result card ──────────────────────────────────────────────────── */
function ResultCard({
  result,
  aspectCls,
  customModelUrls,
  onExpand,
}: {
  result:          GenerationResult
  aspectCls:       string
  customModelUrls?: string[]
  onExpand?:       () => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const isCustom     = isCustomModelId(result.modelId)
  const customIndex  = isCustom ? getCustomModelIndex(result.modelId) : -1
  const model        = isCustom ? null : MODEL_PHOTO_MAP[result.modelId]

  const handleDownload = async () => {
    if (!result.resultUrl || isDownloading) return
    setIsDownloading(true)
    await downloadImage(result.resultUrl, `nurai-${result.modelId}-${Date.now()}`)
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
            ИИ создаёт фото…
          </p>
          <div className="w-3/5 space-y-1.5">
            {[100, 75, 50].map((w) => (
              <div key={w} className="h-1 rounded-full shimmer" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      )}

      {/* Done: result image */}
      {result.status === 'done' && result.resultUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.resultUrl}
            alt="Результат генерации"
            className="w-full h-full object-cover"
          />
          {/* Download button */}
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

          {/* Expand / lightbox button */}
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

      {/* Model name badge — top-left */}
      {(model || isCustom) && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 max-w-[80%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={isCustom ? (customModelUrls?.[customIndex] ?? '') : `/models/${model!.filename}`}
            alt={isCustom ? 'Ваша модель' : model!.name}
            className="w-4 h-4 rounded-full object-cover object-top flex-shrink-0"
          />
          <span className="text-[10px] text-white font-medium truncate">
            {isCustom ? `Моя модель${(customModelUrls?.length ?? 0) > 1 ? ` ${customIndex + 1}` : ''}` : model!.name}
          </span>
        </div>
      )}
    </div>
  )
}

/* ── Main ResultViewer ───────────────────────────────────────────────────── */
export function ResultViewer({
  results,
  aspectRatio,
  onAspectRatioChange,
  onGenerate,
  onRetryFailed,
  canGenerate,
  selectedCount,
  creditsRemaining,
  customModelUrls,
  userPrompt,
  onUserPromptChange,
}: ResultViewerProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [promptOpen,    setPromptOpen]    = useState(false)

  const isAnyGenerating  = results.some((r) => r.status === 'generating')
  const hasResults       = results.length > 0
  const failedCount      = results.filter((r) => r.status === 'error').length
  const enoughCredits    = creditsRemaining == null || creditsRemaining >= selectedCount
  const currentRatio     = RATIOS.find((r) => r.id === aspectRatio)!

  // Build lightbox list from done results
  const lightboxImages: LightboxImage[] = results
    .filter((r) => r.status === 'done' && r.resultUrl)
    .map((r) => ({ url: r.resultUrl! }))

  // Map a result's position among done results for the lightbox
  function doneIndexOf(result: GenerationResult): number {
    return lightboxImages.findIndex((img) => img.url === result.resultUrl)
  }

  const genLabel = () => {
    if (isAnyGenerating) {
      const n = results.filter((r) => r.status === 'generating').length
      return (
        <span className="flex items-center gap-2.5">
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          Генерируем {n} {n === 1 ? 'фото' : 'фото'}…
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
          Выберите модели
        </span>
      )
    }
    return (
      <span className="flex items-center gap-2.5">
        <Sparkles className="w-5 h-5" />
        {selectedCount === 1 ? 'Сгенерировать фото' : `Сгенерировать ${selectedCount} фото`}
        <span className="ml-0.5 text-white/70 text-sm font-normal">
          ({selectedCount} кр.)
        </span>
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3">
        {/* Aspect ratio selector */}
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

        {/* Credits badge */}
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

      {/* Optional prompt */}
      <div className="rounded-xl border border-cream-200 bg-white overflow-hidden">
        <button
          onClick={() => setPromptOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-rose-gold-400" />
            <span className="font-medium">
              {userPrompt.trim() ? 'Пожелание добавлено' : 'Добавить пожелание'}
            </span>
            {userPrompt.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-gold-400" />
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${promptOpen ? 'rotate-180' : ''}`} />
        </button>

        {promptOpen && (
          <div className="px-3.5 pb-3.5 border-t border-cream-100">
            <textarea
              value={userPrompt}
              onChange={(e) => onUserPromptChange(e.target.value)}
              placeholder="Например: золотой час, закат, цветочный фон, студийный свет…"
              maxLength={300}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-rose-gold-300 focus:border-transparent transition-all"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-muted-foreground">
                Опишите желаемый стиль, фон или атмосферу
              </p>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {userPrompt.length}/300
              </span>
            </div>
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

      {/* Results */}
      {hasResults ? (
        <div className={`grid gap-3 ${results.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {results.map((result) => (
            <ResultCard
              key={result.modelId}
              result={result}
              aspectCls={currentRatio.cls}
              customModelUrls={customModelUrls}
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
                  Здесь появятся результаты
                </p>
                <p className="text-xs text-muted-foreground">
                  Загрузите фото и выберите модели
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      {!isAnyGenerating && !canGenerate && selectedCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          ↑ Загрузите фото украшения для начала
        </p>
      )}

      {/* Lightbox */}
      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  )
}
