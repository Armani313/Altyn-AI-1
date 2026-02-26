'use client'

import { Download, Sparkles, ImageIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AspectRatio = '1:1' | '9:16'

interface ResultViewerProps {
  isGenerating: boolean
  resultUrl: string | null
  aspectRatio: AspectRatio
  onAspectRatioChange: (ratio: AspectRatio) => void
  onGenerate: () => void
  canGenerate: boolean
}

const RATIOS: { id: AspectRatio; label: string; class: string }[] = [
  { id: '1:1',  label: '1:1 Пост',     class: 'aspect-square' },
  { id: '9:16', label: '9:16 Сторис',  class: 'aspect-[9/16]' },
]

export function ResultViewer({
  isGenerating,
  resultUrl,
  aspectRatio,
  onAspectRatioChange,
  onGenerate,
  canGenerate,
}: ResultViewerProps) {
  const currentRatio = RATIOS.find((r) => r.id === aspectRatio)!

  return (
    <div className="flex flex-col gap-4">
      {/* Aspect ratio selector */}
      <div className="flex gap-2 p-1 bg-cream-100 rounded-xl self-start">
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

      {/* Result canvas */}
      <div
        className={`relative w-full ${currentRatio.class} rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card`}
      >
        {/* ── Generating state: animated skeleton ── */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-cream-50 to-rose-gold-50">
            {/* Pulsing rings */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-rose-gold-300 animate-ping absolute inset-0 opacity-50" />
              <div className="w-16 h-16 rounded-full border-2 border-rose-gold-400 animate-ping absolute inset-0 opacity-30 [animation-delay:0.3s]" />
              <div className="w-16 h-16 rounded-full bg-rose-gold-100 flex items-center justify-center relative">
                <Sparkles className="w-7 h-7 text-rose-gold-500 animate-pulse" />
              </div>
            </div>

            <div className="text-center">
              <p className="font-medium text-foreground text-sm mb-1">
                ИИ создаёт ваш контент
              </p>
              <p className="text-xs text-muted-foreground">Обычно занимает 5–10 секунд</p>
            </div>

            {/* Shimmer bars */}
            <div className="w-2/3 space-y-2">
              {[100, 80, 60].map((w) => (
                <div
                  key={w}
                  className="h-1.5 rounded-full shimmer"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Result image ── */}
        {resultUrl && !isGenerating && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="Сгенерированное изображение"
              className="w-full h-full object-cover"
            />
            {/* Download overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors group flex items-center justify-center">
              <Button
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 hover:bg-white text-foreground shadow-card border-0"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = resultUrl
                  a.download = `nurai-${Date.now()}.jpg`
                  a.click()
                }}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Скачать
              </Button>
            </div>
          </>
        )}

        {/* ── Empty placeholder ── */}
        {!isGenerating && !resultUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            {/* Decorative glow */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-rose-gold-50/50 via-transparent to-cream-200/30"
            />

            <div className="relative z-10 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cream-100 border border-cream-200 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-foreground/70 text-sm mb-0.5">
                  Здесь появится результат
                </p>
                <p className="text-xs text-muted-foreground">
                  Загрузите фото и нажмите «Сгенерировать»
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-2.5">
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
            canGenerate && !isGenerating
              ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Генерируем...
            </span>
          ) : (
            <span className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5" />
              Сгенерировать контент
            </span>
          )}
        </Button>

        {/* Re-generate / download row */}
        {resultUrl && !isGenerating && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-cream-300 text-muted-foreground hover:text-foreground hover:bg-cream-100"
              onClick={onGenerate}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Ещё раз
            </Button>
            <Button
              variant="outline"
              className="border-cream-300 text-muted-foreground hover:text-foreground hover:bg-cream-100"
              onClick={() => {
                const a = document.createElement('a')
                a.href = resultUrl
                a.download = `nurai-${Date.now()}.jpg`
                a.click()
              }}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Скачать
            </Button>
          </div>
        )}

        {/* Hint */}
        {!canGenerate && (
          <p className="text-center text-xs text-muted-foreground">
            ↑ Загрузите фото украшения для начала
          </p>
        )}
      </div>
    </div>
  )
}
