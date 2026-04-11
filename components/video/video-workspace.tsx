'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Film } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/dashboard/header'
import { UploadZone } from '@/components/generate/upload-zone'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { fetchVideoGenerationStatus } from '@/lib/video/poll-video-generation'
import { VIDEO_CREDITS_COST, VIDEO_SESSION_KEY } from '@/lib/video/constants'
import type { VideoTemplateListItem } from '@/lib/video/types'
import type { VideoGenerationStatus } from '@/types/database.types'
import { VideoTemplatePicker } from '@/components/video/video-template-picker'
import { VideoResultViewer } from '@/components/video/video-result-viewer'

type MobileStep = 1 | 2 | 3

export function VideoWorkspace() {
  const t = useTranslations('video')
  const tTemplates = useTranslations('videoTemplates')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<VideoTemplateListItem[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [mobileStep, setMobileStep] = useState<MobileStep>(1)
  const [generationStatus, setGenerationStatus] = useState<VideoGenerationStatus | null>(null)
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const pollRunIdRef = useRef(0)

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  )

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
          setCreditsRemaining(result.creditsRemaining)
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
  }, [t])

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
            setCreditsRemaining(profile.credits_remaining)
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [])

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
      setMobileStep(3)
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
    setMobileStep(2)
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
    if (!uploadedFile || !selectedTemplateId || isGenerating) return

    const formData = new FormData()
    formData.append('image', uploadedFile)
    formData.append('template_id', selectedTemplateId)

    setMobileStep(3)
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
        return
      }

      setGenerationStatus('processing')
      if (typeof data.creditsRemaining === 'number') {
        setCreditsRemaining(data.creditsRemaining)
      }

      sessionStorage.setItem(VIDEO_SESSION_KEY, data.generationId)
      await pollGeneration(data.generationId)
    } catch {
      setGenerationStatus('failed')
      setGenerationError(t('errorConnection'))
    }
  }, [isGenerating, pollGeneration, selectedTemplateId, t, uploadedFile])

  const handleRetry = useCallback(() => {
    void handleGenerate()
  }, [handleGenerate])

  const step1Done = !!previewUrl
  const step2Done = !!selectedTemplateId
  const canGenerate = !!uploadedFile && !!selectedTemplateId && !isGenerating

  const MOBILE_STEPS = [
    { id: 1 as MobileStep, label: t('mobileStep1') },
    { id: 2 as MobileStep, label: t('mobileStep2') },
    { id: 3 as MobileStep, label: t('mobileStep3') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      <div className="lg:hidden sticky top-0 z-20 mt-3 flex border-b border-cream-200 bg-white/90 backdrop-blur-lg">
        {MOBILE_STEPS.map((step) => {
          const done = step.id === 1 ? step1Done : step.id === 2 ? step2Done : false
          const active = mobileStep === step.id

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setMobileStep(step.id)}
              className={`flex min-h-[48px] flex-1 items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition-colors ${
                active ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                done
                  ? 'bg-emerald-400 text-white'
                  : active
                    ? 'gradient-rose-gold text-white'
                    : 'bg-cream-200 text-muted-foreground'
              }`}>
                {done ? <Check className="h-3 w-3" /> : step.id}
              </span>
              {step.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 p-3 sm:p-5 xl:p-6">
        <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-[1fr_1.15fr_1fr]">
          <div className={`flex-col gap-3 ${mobileStep === 1 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="01" title={t('step1')} />
            <UploadZone
              previewUrl={previewUrl}
              onUpload={handleUpload}
              onRemove={handleRemove}
              dragLabel={t('dragLabel')}
            />
            <p className="text-center text-xs text-muted-foreground">{t('uploadHint')}</p>
          </div>

          <div className={`flex-col gap-3 ${mobileStep === 2 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel
              step="02"
              title={selectedTemplate ? t('step2Selected') : t('step2')}
            />
            <div className="flex-1 rounded-2xl border border-cream-200 bg-white p-3 shadow-soft sm:p-4">
              <VideoTemplatePicker
                templates={templates}
                selectedId={selectedTemplateId}
                onSelect={(id) => {
                  setSelectedTemplateId(id)
                  setGenerationError(null)
                  setGenerationStatus(null)
                  setOutputVideoUrl(null)
                  setPosterUrl(previewUrl)
                  setMobileStep(3)
                }}
                disabled={isGenerating}
                loading={loadingTemplates}
              />
            </div>
          </div>

          <div className={`flex-col gap-3 ${mobileStep === 3 ? 'flex' : 'hidden lg:flex'}`}>
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
            />
          </div>
        </div>
      </div>

      <div className="lg:hidden sticky bottom-0 z-20 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent p-3 pt-6">
        {mobileStep === 1 ? (
          <Button
            size="mobile"
            onClick={() => previewUrl ? setMobileStep(2) : undefined}
            disabled={!previewUrl}
            className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
          >
            {t('mobileNextTemplates')}
          </Button>
        ) : mobileStep === 2 ? (
          <Button
            size="mobile"
            onClick={() => selectedTemplateId ? setMobileStep(3) : undefined}
            disabled={!selectedTemplateId}
            className="w-full bg-primary text-white shadow-soft hover:bg-rose-gold-600"
          >
            {t('mobileNextGenerate')}
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
                {t('costValue', { n: VIDEO_CREDITS_COST })}
              </span>
            </div>
          </div>
        )}
      </div>
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
