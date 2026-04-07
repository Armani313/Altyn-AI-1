'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header }         from '@/components/dashboard/header'
import { UploadZone }     from '@/components/generate/upload-zone'
import { TemplatePicker } from '@/components/generate/template-picker'
import { ResultViewer } from '@/components/generate/result-viewer'
import { createClient }   from '@/lib/supabase/client'
import type { ProductType } from '@/lib/constants'
import {
  getLifestyleGenerationStore,
  type LifestyleWorkspaceSnapshot,
} from '@/lib/lifestyle-generation-store'

type AspectRatio = '1:1' | '9:16'
type MobileStep  = 1 | 2 | 3

const MAX_SELECTED_TEMPLATES = 4

interface CategoryWorkspaceProps {
  productType: ProductType
}

export function CategoryWorkspace({ productType }: CategoryWorkspaceProps) {
  const t = useTranslations('dashboard')
  const store = getLifestyleGenerationStore(productType)

  const MOBILE_STEPS = [
    { id: 1 as MobileStep, label: t('mobileStep1') },
    { id: 2 as MobileStep, label: t('mobileStep2') },
    { id: 3 as MobileStep, label: t('mobileStep3') },
  ]

  const [workspace, setWorkspace] = useState<LifestyleWorkspaceSnapshot>(() => store.snapshot)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [customModelUrls, setCustomModelUrls] = useState<string[]>([])
  const [mobileStep, setMobileStep] = useState<MobileStep>(() => {
    const snapshot = store.snapshot
    if (snapshot.results.length > 0 || snapshot.running || snapshot.selectedTemplates.length > 0) return 3
    if (snapshot.previewUrl) return 2
    return 1
  })

  const previewUrl = workspace.previewUrl
  const selectedTemplates = workspace.selectedTemplates
  const aspectRatio = workspace.aspectRatio
  const generationResults = workspace.results
  const userPrompt = workspace.userPrompt

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || cancelled) return

      const [profileResult, modelsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('credits_remaining')
          .eq('id', user.id)
          .single(),
        fetch('/api/models', { cache: 'no-store', credentials: 'same-origin' }).catch(() => null),
      ])

      if (cancelled) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = profileResult.data as any
      if (profile?.credits_remaining != null) {
        setCreditsRemaining(profile.credits_remaining as number)
      }

      if (modelsResponse?.ok) {
        const data = await modelsResponse.json()
        if (!cancelled && Array.isArray(data?.urls)) {
          setCustomModelUrls(data.urls as string[])
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return store.subscribe((snapshot, nextCredits) => {
      setWorkspace({ ...snapshot })
      if (typeof nextCredits === 'number') {
        setCreditsRemaining(nextCredits)
      }
    })
  }, [store])

  const handleUpload = useCallback(
    (file: File, url: string) => {
      store.setUpload(file, url)
      setMobileStep(2)
    },
    [store]
  )

  const handleRemove = useCallback(() => {
    store.clearUpload()
    setMobileStep(1)
  }, [store])

  const handleTemplateSelect = useCallback((ids: string[]) => {
    store.setSelectedTemplates(ids)
    if (ids.length > 0) {
      setMobileStep(3)
      return
    }

    if (previewUrl) {
      setMobileStep(2)
    }
  }, [previewUrl, store])

  const handleGenerate = useCallback(async () => {
    setMobileStep(3)
    await store.startGeneration(productType, creditsRemaining, {
      generationError: t('errorGeneration'),
      connectionError: t('errorConnection'),
      insufficientCredits: (needed, available) =>
        t('errorInsufficientCredits', { needed, available }),
    })
  }, [creditsRemaining, productType, store, t])

  const handleRetryFailed = useCallback(async () => {
    await store.retryFailed(productType, creditsRemaining, {
      generationError: t('errorGeneration'),
      connectionError: t('errorConnection'),
      insufficientCredits: (needed, available) =>
        t('errorInsufficientCredits', { needed, available }),
    })
  }, [creditsRemaining, productType, store, t])

  const isAnyGenerating = generationResults.some((r) => r.status === 'generating')
  const canGenerate     = !!previewUrl && !isAnyGenerating && selectedTemplates.length > 0
  const step1Done = !!previewUrl
  const step2Done = selectedTemplates.length > 0

  const uploadLabel = t(`uploadLabel_${productType}` as Parameters<typeof t>[0])
  const uploadHint  = t(`uploadHint_${productType}` as Parameters<typeof t>[0])
  const dragLabel   = t(`dragLabel_${productType}` as Parameters<typeof t>[0])

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t(productType as Parameters<typeof t>[0])}
        subtitle={t('headerSubtitle')}
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      {/* ── Mobile step tabs ──────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-cream-200 flex mt-3">
        {MOBILE_STEPS.map((step) => {
          const done   = step.id === 1 ? step1Done : step.id === 2 ? step2Done : false
          const active = mobileStep === step.id
          return (
            <button
              key={step.id}
              onClick={() => setMobileStep(step.id)}
              className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors min-h-[48px] touch-feedback ${
                active ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                done    ? 'bg-emerald-400 text-white'
                : active ? 'gradient-rose-gold text-white'
                         : 'bg-cream-200 text-muted-foreground'
              }`}>
                {done ? <Check className="w-3 h-3" /> : step.id}
              </span>
              {step.label}
              {step.id === 2 && selectedTemplates.length > 0 && (
                <span className="ml-0.5 text-[10px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {selectedTemplates.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Workspace ─────────────────────────────────────────────────── */}
      <div className="flex-1 p-3 sm:p-5 xl:p-6">
        <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_1.15fr_1fr] gap-3 sm:gap-5">

          {/* ── Column 1: Upload ──── */}
          <div className={`flex-col gap-3 ${mobileStep === 1 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="01" title={uploadLabel} />
            <UploadZone
              previewUrl={previewUrl}
              onUpload={handleUpload}
              onRemove={handleRemove}
              dragLabel={dragLabel}
            />
            <p className="text-xs text-muted-foreground text-center">{uploadHint}</p>
          </div>

          {/* ── Column 2: Templates ── */}
          <div className={`flex-col gap-3 ${mobileStep === 2 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel
              step="02"
              title={
                selectedTemplates.length > 0
                  ? t('chooseModels', { count: selectedTemplates.length, max: MAX_SELECTED_TEMPLATES })
                  : t('chooseModelsEmpty')
              }
            />
            <div className="flex-1 bg-white rounded-2xl border border-cream-200 p-3 sm:p-4 shadow-soft">
              <TemplatePicker
                selectedIds={selectedTemplates}
                onSelect={handleTemplateSelect}
                maxSelect={MAX_SELECTED_TEMPLATES}
                disabled={isAnyGenerating}
                productType={productType}
                customModelUrls={customModelUrls}
                onCustomModelUrlsChange={setCustomModelUrls}
              />
            </div>
          </div>

          {/* ── Column 3: Results ──── */}
          <div className={`flex-col gap-3 ${mobileStep === 3 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="03" title={t('getResult')} />
            <ResultViewer
              results={generationResults}
              aspectRatio={aspectRatio}
              onAspectRatioChange={(ratio) => store.setAspectRatio(ratio)}
              onGenerate={handleGenerate}
              onRetryFailed={handleRetryFailed}
              canGenerate={canGenerate}
              creditsRemaining={creditsRemaining}
              customModelUrls={customModelUrls}
              userPrompt={userPrompt}
              onUserPromptChange={(value) => store.setUserPrompt(value)}
              selectedCount={selectedTemplates.length}
            />
          </div>

        </div>
      </div>

      {/* ── Mobile floating CTA ──────────────────────────────────────── */}
      <div className="lg:hidden sticky bottom-0 z-20 p-3 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent pt-6">
        {mobileStep === 1 && (
          <Button
            onClick={() => previewUrl ? setMobileStep(2) : undefined}
            disabled={!previewUrl}
            size="mobile"
            className={`w-full touch-feedback ${
              previewUrl
                ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {previewUrl ? (
              <span className="flex items-center gap-2">
                {t('mobileNextModels')}
                <ArrowRight className="w-5 h-5" />
              </span>
            ) : (
              t('mobileUploadFirst')
            )}
          </Button>
        )}
        {mobileStep === 2 && (
          <Button
            onClick={() => selectedTemplates.length > 0 ? setMobileStep(3) : undefined}
            disabled={selectedTemplates.length === 0}
            size="mobile"
            className={`w-full touch-feedback ${
              selectedTemplates.length > 0
                ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              {t('mobileNextGenerate')}
              {selectedTemplates.length > 0 && (
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm">
                  {selectedTemplates.length}
                </span>
              )}
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
        )}
        {mobileStep === 3 && !isAnyGenerating && generationResults.length === 0 && (
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            size="mobile"
            className={`w-full touch-feedback ${
              canGenerate
                ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-glow'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t('mobileStep3')}
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="w-6 h-6 rounded-full gradient-rose-gold flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
        {step}
      </span>
      <h2 className="font-sans font-semibold text-sm text-foreground">{title}</h2>
    </div>
  )
}
