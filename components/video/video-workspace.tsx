'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronRight, Film, Play, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/dashboard/header'
import { UploadZone } from '@/components/generate/upload-zone'
import { Button } from '@/components/ui/button'
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude'
import { createClient } from '@/lib/supabase/client'
import { useDashboardProfile } from '@/components/dashboard/dashboard-profile-provider'
import { fetchVideoGenerationStatus } from '@/lib/video/poll-video-generation'
import { VIDEO_SESSION_KEY } from '@/lib/video/constants'
import {
  DEFAULT_VIDEO_SETTINGS,
  calculateVideoCredits,
  sanitizeVideoSettings,
  type VideoGenerationSettings,
} from '@/lib/video/options'
import type { VideoTemplateListItem } from '@/lib/video/types'
import type { VideoGenerationStatus } from '@/types/database.types'
import { VideoTemplatePicker } from '@/components/video/video-template-picker'
import { VideoResultViewer } from '@/components/video/video-result-viewer'
import { VideoSettingsPanel } from '@/components/video/video-settings-panel'
import { isPremiumTemplateLocked } from '@/lib/config/plans'


export function VideoWorkspace() {
  const t = useTranslations('video')
  const tTemplates = useTranslations('videoTemplates')
  const dashboardProfile = useDashboardProfile()
  const currentPlan = dashboardProfile?.profile?.plan ?? 'free'
  const providerCreditsRemaining = dashboardProfile?.profile?.credits_remaining ?? null
  const setDashboardCreditsRemaining = dashboardProfile?.setCreditsRemaining
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<VideoTemplateListItem[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [localCreditsRemaining, setLocalCreditsRemaining] = useState<number | null>(null)
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus | null>(null)
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [videoSettings, setVideoSettings] = useState<VideoGenerationSettings>(DEFAULT_VIDEO_SETTINGS)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const pollRunIdRef = useRef(0)

  const creditsCost = useMemo(() => calculateVideoCredits(videoSettings), [videoSettings])

  const handleSettingsChange = useCallback((patch: Partial<VideoGenerationSettings>) => {
    setVideoSettings((prev) => {
      const merged = { ...prev, ...patch }
      return sanitizeVideoSettings(merged, { isUgcTemplate: false })
    })
  }, [])

  const rawSelectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  )
  const selectedTemplate = rawSelectedTemplate && !isPremiumTemplateLocked(currentPlan, rawSelectedTemplate.premium)
    ? rawSelectedTemplate
    : null
  const effectiveSelectedTemplateId = selectedTemplate?.id ?? null
  const creditsRemaining = localCreditsRemaining ?? providerCreditsRemaining

  const isGenerating = generationStatus === 'queued' || generationStatus === 'processing'
  const selectedTemplateName = selectedTemplate
    ? (tTemplates.has(`names.${selectedTemplate.id}`)
        ? tTemplates(`names.${selectedTemplate.id}`)
        : selectedTemplate.name)
    : t('noTemplate')

  const stopPolling = useCallback(() => {
    pollRunIdRef.current += 1
  }, [])

  const pollGeneration = useCallback(async (nextGenerationId: string) => {
    const runId = ++pollRunIdRef.current
    const deadline = Date.now() + 8 * 60_000

    while (runId === pollRunIdRef.current && Date.now() < deadline) {
      try {
        const result = await fetchVideoGenerationStatus(nextGenerationId)
        if (runId !== pollRunIdRef.current) return

        setGenerationStatus(result.status)
        setOutputVideoUrl(result.outputVideoUrl)
        setPosterUrl(result.posterUrl)
        setGenerationError(result.error)
        if (typeof result.creditsRemaining === 'number') {
          setLocalCreditsRemaining(result.creditsRemaining)
          setDashboardCreditsRemaining?.(result.creditsRemaining)
        }

        if (result.status === 'completed' || result.status === 'failed') {
          sessionStorage.removeItem(VIDEO_SESSION_KEY)
          return
        }
      } catch (error) {
        if (runId !== pollRunIdRef.current) return
        setGenerationError(
          error instanceof Error ? error.message : t('errorConnection')
        )
      }

      await new Promise<void>((resolve) => window.setTimeout(resolve, 10_000))
    }
  }, [setDashboardCreditsRemaining, t])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return

      supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (cancelled) return
          const profile = data as { credits_remaining: number } | null
          if (profile?.credits_remaining != null) {
            setLocalCreditsRemaining(profile.credits_remaining)
            setDashboardCreditsRemaining?.(profile.credits_remaining)
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [setDashboardCreditsRemaining])

  useEffect(() => {
    let cancelled = false

    fetch('/api/video-templates', { cache: 'no-store', credentials: 'same-origin' })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return
        setTemplates(Array.isArray(data) ? data as VideoTemplateListItem[] : [])
      })
      .catch(() => {
        if (!cancelled) setTemplates([])
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const pendingGenerationId = sessionStorage.getItem(VIDEO_SESSION_KEY)
    if (!pendingGenerationId) return

    const timeoutId = window.setTimeout(() => {
      setGenerationStatus('processing')

      void pollGeneration(pendingGenerationId)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      stopPolling()
    }
  }, [pollGeneration, stopPolling])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const handleUpload = useCallback((file: File, url: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(file)
    setPreviewUrl(url)
    setPosterUrl(url)
    setGenerationStatus(null)
    setOutputVideoUrl(null)
    setGenerationError(null)
  }, [previewUrl])

  const handleRemove = useCallback(() => {
    if (isGenerating) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    stopPolling()

    setUploadedFile(null)
    setPreviewUrl(null)
    setPosterUrl(null)
    setSelectedTemplateId(null)
    setGenerationStatus(null)
    setOutputVideoUrl(null)
    setGenerationError(null)
    sessionStorage.removeItem(VIDEO_SESSION_KEY)
  }, [isGenerating, previewUrl, stopPolling])

  const handleGenerate = useCallback(async () => {
    if (!uploadedFile || !effectiveSelectedTemplateId || isGenerating) return

    void trackAmplitudeEvent('video_generation_requested', {
      template_id: effectiveSelectedTemplateId,
      aspect_ratio: videoSettings.aspectRatio,
      duration_seconds: videoSettings.durationSeconds,
      resolution: videoSettings.resolution,
      voice_mode: videoSettings.voiceMode,
      credits_cost: creditsCost,
      credits_remaining: creditsRemaining,
    })

    const formData = new FormData()
    formData.append('image', uploadedFile)
    formData.append('template_id', effectiveSelectedTemplateId)
    formData.append('aspect_ratio', videoSettings.aspectRatio)
    formData.append('duration_seconds', String(videoSettings.durationSeconds))
    formData.append('resolution', videoSettings.resolution)
    formData.append('voice_mode', videoSettings.voiceMode)
    if (videoSettings.negativePrompt) {
      formData.append('negative_prompt', videoSettings.negativePrompt)
    }

    setGenerationError(null)
    setGenerationStatus('queued')
    setOutputVideoUrl(null)

    try {
      const response = await fetch('/api/video-generations', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json() as {
        generationId?: string
        creditsRemaining?: number
        error?: string
      }

      if (!response.ok || !data.generationId) {
        setGenerationStatus('failed')
        setGenerationError(data.error ?? t('errorGeneration'))
        void trackAmplitudeEvent('video_generation_failed', {
          template_id: effectiveSelectedTemplateId,
          reason: data.error ?? 'generation_error',
        })
        return
      }

      setGenerationStatus('processing')
      if (typeof data.creditsRemaining === 'number') {
        setLocalCreditsRemaining(data.creditsRemaining)
        setDashboardCreditsRemaining?.(data.creditsRemaining)
      }

      sessionStorage.setItem(VIDEO_SESSION_KEY, data.generationId)
      await pollGeneration(data.generationId)
    } catch {
      setGenerationStatus('failed')
      setGenerationError(t('errorConnection'))
      void trackAmplitudeEvent('video_generation_failed', {
        template_id: effectiveSelectedTemplateId,
        reason: 'connection_error',
      })
    }
  }, [creditsCost, creditsRemaining, effectiveSelectedTemplateId, isGenerating, pollGeneration, setDashboardCreditsRemaining, t, uploadedFile, videoSettings])

  const handleRetry = useCallback(() => {
    void handleGenerate()
  }, [handleGenerate])

  const canGenerate = !!uploadedFile && !!effectiveSelectedTemplateId && !isGenerating

  const handleSelectTemplate = useCallback((id: string) => {
    void trackAmplitudeEvent('video_template_selected', { template_id: id })
    setSelectedTemplateId(id)
    setGenerationError(null)
    setGenerationStatus(null)
    setOutputVideoUrl(null)
    setPosterUrl(previewUrl)
    setTemplateDialogOpen(false)
  }, [previewUrl])

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      <div className="flex-1 p-3 sm:p-5 xl:p-6">
        <div className="mx-auto flex h-full max-w-[1100px] flex-col gap-4 sm:gap-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-4 shadow-soft sm:px-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                  {t('testingBadge')}
                </span>
                <p className="mt-2 text-sm font-semibold text-amber-950 sm:text-[15px]">
                  {t('testingTitle')}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900/85">
                  {t('testingDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Left column: Upload + Settings */}
            <div className="flex flex-col gap-4">
              <SectionLabel step="01" title={t('step1')} />
              <UploadZone
                previewUrl={previewUrl}
                onUpload={handleUpload}
                onRemove={handleRemove}
                dragLabel={t('dragLabel')}
              />

              <SectionLabel step="02" title={selectedTemplate ? t('step2Selected') : t('step2')} />

              {/* Template trigger card */}
              <button
                type="button"
                onClick={() => setTemplateDialogOpen(true)}
                disabled={isGenerating}
                className="group w-full rounded-2xl border border-cream-200 bg-white p-3 text-left shadow-soft transition-all hover:border-rose-gold-200 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-50 sm:p-4"
              >
                {selectedTemplate ? (
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream-100">
                      <video
                        src={selectedTemplate.demoVideoUrl}
                        poster={selectedTemplate.coverImageUrl}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {selectedTemplateName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('changeTemplate')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-cream-100">
                      <Sparkles className="h-5 w-5 text-rose-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {t('chooseTemplate')}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('chooseTemplateHint')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </button>

              {/* Settings panel */}
              <VideoSettingsPanel
                value={videoSettings}
                onChange={handleSettingsChange}
                disabled={isGenerating}
              />

              {/* Cost summary */}
              <div className="rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-rose-gold-500" />
                    <span className="font-medium text-foreground">{t('costLabel')}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {t('costValue', { n: creditsCost })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column: Result */}
            <div className="flex flex-col gap-4">
              <SectionLabel step="03" title={t('step3')} />
              <VideoResultViewer
                selectedTemplate={selectedTemplate}
                status={generationStatus}
                outputVideoUrl={outputVideoUrl}
                posterUrl={posterUrl}
                error={generationError}
                onGenerate={handleGenerate}
                onRetry={handleRetry}
                canGenerate={canGenerate}
                creditsRemaining={creditsRemaining}
                creditsCost={creditsCost}
                settings={videoSettings}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom */}
      <div className="lg:hidden sticky bottom-0 z-20 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent p-3 pt-6">
        {!effectiveSelectedTemplateId ? (
          <Button
            size="mobile"
            onClick={() => setTemplateDialogOpen(true)}
            disabled={!previewUrl}
            className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
          >
            {t('chooseTemplate')}
          </Button>
        ) : !isGenerating && !outputVideoUrl ? (
          <Button
            size="mobile"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
          >
            {t('generate')} — {t('costValue', { n: creditsCost })}
          </Button>
        ) : (
          <div className="rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-soft">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-rose-gold-500" />
                <span className="font-medium text-foreground">
                  {selectedTemplateName}
                </span>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {t('costValue', { n: creditsCost })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Template picker dialog */}
      {templateDialogOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 animate-in fade-in-0"
            onClick={() => setTemplateDialogOpen(false)}
          />
          <div className="absolute inset-4 sm:inset-8 lg:inset-y-[5vh] lg:inset-x-[calc(50%-384px)] flex flex-col rounded-2xl border border-cream-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('step2')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('chooseTemplateHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateDialogOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-cream-100 hover:text-foreground"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:pb-6">
              <VideoTemplatePicker
                templates={templates}
                selectedId={effectiveSelectedTemplateId}
                onSelect={handleSelectTemplate}
                disabled={isGenerating}
                loading={loadingTemplates}
                currentPlan={currentPlan}
                compact
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SectionLabel({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full gradient-rose-gold text-[10px] font-bold text-white">
        {step}
      </span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  )
}
