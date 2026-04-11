'use client'

import { useState } from 'react'
import { Clapperboard, Download, Loader2, RotateCcw, Sparkles, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { VideoGenerationStatus } from '@/types/database.types'
import type { VideoTemplateListItem } from '@/lib/video/types'
import {
  VIDEO_ASPECT_RATIO,
  VIDEO_CREDITS_COST,
  VIDEO_DURATION_SECONDS,
  VIDEO_RESOLUTION,
} from '@/lib/video/constants'

interface VideoResultViewerProps {
  selectedTemplate: VideoTemplateListItem | null
  status: VideoGenerationStatus | null
  outputVideoUrl: string | null
  posterUrl: string | null
  error: string | null
  onGenerate: () => void
  onRetry: () => void
  canGenerate: boolean
  creditsRemaining: number | null
}

async function downloadVideo(url: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = 'luminify-video.mp4'
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function VideoResultViewer({
  selectedTemplate,
  status,
  outputVideoUrl,
  posterUrl,
  error,
  onGenerate,
  onRetry,
  canGenerate,
  creditsRemaining,
}: VideoResultViewerProps) {
  const t = useTranslations('video')
  const tTemplates = useTranslations('videoTemplates')
  const [downloading, setDownloading] = useState(false)

  const selectedTemplateName = selectedTemplate
    ? (tTemplates.has(`names.${selectedTemplate.id}`)
        ? tTemplates(`names.${selectedTemplate.id}`)
        : selectedTemplate.name)
    : t('noTemplate')

  const isGenerating = status === 'queued' || status === 'processing'
  const isCompleted = status === 'completed' && !!outputVideoUrl
  const isFailed = status === 'failed'

  const handleDownload = async () => {
    if (!outputVideoUrl || downloading) return
    setDownloading(true)
    try {
      await downloadVideo(outputVideoUrl)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-[28px] border border-cream-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-gold-500">
            {t('resultEyebrow')}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {selectedTemplate ? t('resultReady') : t('resultIdle')}
          </h3>
        </div>
        <div className="rounded-full border border-cream-200 bg-cream-50 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
          {VIDEO_ASPECT_RATIO} · {VIDEO_DURATION_SECONDS}s · {VIDEO_RESOLUTION}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[26px] border border-cream-200 bg-gradient-to-br from-slate-950 via-slate-900 to-stone-900">
        <div className="aspect-[9/16]">
          {isCompleted && outputVideoUrl ? (
            <video
              src={outputVideoUrl}
              poster={posterUrl ?? undefined}
              controls
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 text-center">
              {selectedTemplate?.coverImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterUrl ?? selectedTemplate.coverImageUrl}
                    alt={t('resultPosterAlt')}
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black/75" />
                </>
              ) : null}

              <div className="relative z-10 flex max-w-[260px] flex-col items-center">
                {isGenerating ? (
                  <div className="mb-5 rounded-full border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                  </div>
                ) : isFailed ? (
                  <div className="mb-5 rounded-full border border-red-400/30 bg-red-500/10 p-4 backdrop-blur">
                    <AlertCircle className="h-7 w-7 text-red-100" />
                  </div>
                ) : (
                  <div className="mb-5 rounded-full border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <Clapperboard className="h-7 w-7 text-white" />
                  </div>
                )}

                <h4 className="text-lg font-semibold text-white">
                  {isGenerating
                    ? t('generating')
                    : isFailed
                      ? t('failedTitle')
                      : t('idleTitle')}
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {isGenerating
                    ? t('generatingDesc')
                    : isFailed
                      ? (error ?? t('failedDesc'))
                      : selectedTemplate
                        ? t('idleSelectedDesc')
                        : t('idleDesc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('selectedTemplate')}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {selectedTemplateName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('costLabel')}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {t('costValue', { n: VIDEO_CREDITS_COST })}
            </p>
          </div>
        </div>

        {creditsRemaining !== null ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t('creditsRemaining', { n: creditsRemaining })}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {isCompleted && outputVideoUrl ? (
          <>
            <Button
              size="mobile"
              onClick={handleDownload}
              disabled={downloading}
              className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
            >
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              {downloading ? t('downloading') : t('download')}
            </Button>
            <Button
              variant="outline"
              size="mobile"
              onClick={onGenerate}
              className="w-full border-cream-300 bg-white"
            >
              <Sparkles />
              {t('generateAgain')}
            </Button>
          </>
        ) : isFailed ? (
          <Button
            size="mobile"
            onClick={onRetry}
            disabled={!selectedTemplate}
            className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
          >
            <RotateCcw />
            {t('retry')}
          </Button>
        ) : (
          <Button
            size="mobile"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
          >
            {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isGenerating ? t('processingCta') : t('generate')}
          </Button>
        )}
      </div>
    </div>
  )
}
