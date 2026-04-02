'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header }         from '@/components/dashboard/header'
import { UploadZone }     from '@/components/generate/upload-zone'
import { TemplatePicker } from '@/components/generate/template-picker'
import { ResultViewer, type GenerationResult } from '@/components/generate/result-viewer'
import type { PanelVariant } from '@/components/generate/contact-sheet-viewer'
import { createClient }   from '@/lib/supabase/client'
import type { ProductType } from '@/lib/constants'
import { isAiFreeLifestyleId } from '@/lib/constants'

type AspectRatio = '1:1' | '9:16'
type MobileStep  = 1 | 2 | 3

const MAX_PARALLEL = 4

interface CategoryWorkspaceProps {
  productType: ProductType
}

export function CategoryWorkspace({ productType }: CategoryWorkspaceProps) {
  const t = useTranslations('dashboard')

  const MOBILE_STEPS = [
    { id: 1 as MobileStep, label: t('mobileStep1') },
    { id: 2 as MobileStep, label: t('mobileStep2') },
    { id: 3 as MobileStep, label: t('mobileStep3') },
  ]

  const [previewUrl,         setPreviewUrl]         = useState<string | null>(null)
  const [uploadedFile,       setUploadedFile]       = useState<File | null>(null)
  const [selectedTemplates,  setSelectedTemplates]  = useState<string[]>([])
  const [aspectRatio,        setAspectRatio]        = useState<AspectRatio>('1:1')
  const [generationResults,  setGenerationResults]  = useState<GenerationResult[]>([])
  const [creditsRemaining,   setCreditsRemaining]   = useState<number | null>(null)
  const [customModelUrls,    setCustomModelUrls]    = useState<string[]>([])
  const [mobileStep,         setMobileStep]         = useState<MobileStep>(1)
  const [userPrompt,         setUserPrompt]         = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('credits_remaining, custom_model_urls')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = data as any
          if (profile?.credits_remaining != null) {
            setCreditsRemaining(profile.credits_remaining as number)
          }
          if (Array.isArray(profile?.custom_model_urls)) {
            setCustomModelUrls(profile.custom_model_urls as string[])
          }
        })
    })
  }, [])

  const handleUpload = useCallback(
    (file: File, url: string) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadedFile(file)
      setPreviewUrl(url)
      setGenerationResults([])
      setMobileStep(2)
    },
    [previewUrl]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setGenerationResults([])
    setSelectedTemplates([])
  }, [previewUrl])

  const handleTemplateSelect = (ids: string[]) => {
    setSelectedTemplates(ids)
    if (ids.length > 0 && mobileStep === 2) setMobileStep(3)
  }

  const handleGenerate = useCallback(async () => {
    if (!uploadedFile) return

    const templates = selectedTemplates.length > 0 ? selectedTemplates : ['standalone']

    if (creditsRemaining !== null && creditsRemaining < templates.length) {
      setGenerationResults(
        templates.flatMap((_, gi) =>
          [1, 2, 3, 4].map((panelId) => ({
            modelId:   `g${gi}_p${panelId}`,
            status:    'error' as const,
            resultUrl: null,
            error:     t('errorInsufficientCredits', { needed: templates.length, available: creditsRemaining }),
          }))
        )
      )
      setMobileStep(3)
      return
    }

    setGenerationResults(
      templates.flatMap((_, gi) =>
        [1, 2, 3, 4].map((panelId) => ({
          modelId:   `g${gi}_p${panelId}`,
          status:    'generating' as const,
          resultUrl: null,
          error:     null,
        }))
      )
    )
    setMobileStep(3)

    await Promise.allSettled(
      templates.map(async (modelId, gi) => {
        const prefix = `g${gi}`
        try {
          const fd = new FormData()
          fd.append('image',               uploadedFile)
          fd.append('product_type',        productType)
          fd.append('contact_sheet_ratio', aspectRatio)
          if (isAiFreeLifestyleId(modelId)) {
            fd.append('generate_mode', 'lifestyle-free')
          } else {
            fd.append('generate_mode', 'contact-sheet')
            if (modelId !== 'standalone') fd.append('model_id', modelId)
          }
          if (userPrompt.trim()) fd.append('user_prompt', userPrompt.trim())

          const res  = await fetch('/api/generate', { method: 'POST', body: fd })
          const data = await res.json() as {
            success?: boolean
            panels?: PanelVariant[]
            creditsRemaining?: number
            error?: string
          }

          if (!res.ok || !data.success || !data.panels) {
            const errMsg = data.error ?? t('errorGeneration')
            setGenerationResults((prev) =>
              prev.map((r) => r.modelId.startsWith(prefix)
                ? { ...r, status: 'error', error: errMsg }
                : r
              )
            )
            return
          }

          setGenerationResults((prev) =>
            prev.map((r) => {
              if (!r.modelId.startsWith(prefix)) return r
              const panelId = parseInt(r.modelId.split('_p')[1], 10)
              const panel   = data.panels!.find((p) => p.id === panelId)
              return panel ? { ...r, status: 'done', resultUrl: panel.url } : r
            })
          )
          if (typeof data.creditsRemaining === 'number') {
            setCreditsRemaining(data.creditsRemaining)
          }
        } catch {
          setGenerationResults((prev) =>
            prev.map((r) => r.modelId.startsWith(prefix)
              ? { ...r, status: 'error', error: t('errorConnection') }
              : r
            )
          )
        }
      })
    )
  }, [uploadedFile, selectedTemplates, productType, aspectRatio, userPrompt, creditsRemaining, t])

  const handleRetryFailed = useCallback(async () => {
    if (!uploadedFile) return

    const failedPrefixes = Array.from(
      new Set(
        generationResults
          .filter((r) => r.status === 'error')
          .map((r) => r.modelId.split('_p')[0])
      )
    )
    if (failedPrefixes.length === 0) return

    const templates = selectedTemplates.length > 0 ? selectedTemplates : ['standalone']
    const retryTemplates = failedPrefixes
      .map((prefix) => {
        const gi = parseInt(prefix.slice(1), 10)
        return templates[gi] ?? null
      })
      .filter(Boolean) as string[]

    if (retryTemplates.length === 0) return

    if (creditsRemaining !== null && creditsRemaining < retryTemplates.length) {
      setGenerationResults((prev) =>
        prev.map((r) =>
          failedPrefixes.some((p) => r.modelId.startsWith(p))
            ? { ...r, error: t('errorInsufficientCredits', { needed: retryTemplates.length, available: creditsRemaining }) }
            : r
        )
      )
      return
    }

    setGenerationResults((prev) =>
      prev.map((r) =>
        failedPrefixes.some((p) => r.modelId.startsWith(p))
          ? { ...r, status: 'generating', error: null }
          : r
      )
    )

    await Promise.allSettled(
      retryTemplates.map(async (modelId, i) => {
        const prefix = failedPrefixes[i]
        try {
          const fd = new FormData()
          fd.append('image',               uploadedFile)
          fd.append('product_type',        productType)
          fd.append('contact_sheet_ratio', aspectRatio)
          if (isAiFreeLifestyleId(modelId)) {
            fd.append('generate_mode', 'lifestyle-free')
          } else {
            fd.append('generate_mode', 'contact-sheet')
            if (modelId !== 'standalone') fd.append('model_id', modelId)
          }
          if (userPrompt.trim()) fd.append('user_prompt', userPrompt.trim())

          const res  = await fetch('/api/generate', { method: 'POST', body: fd })
          const data = await res.json() as {
            success?: boolean
            panels?: PanelVariant[]
            creditsRemaining?: number
            error?: string
          }

          if (!res.ok || !data.success || !data.panels) {
            const errMsg = data.error ?? t('errorGeneration')
            setGenerationResults((prev) =>
              prev.map((r) => r.modelId.startsWith(prefix) ? { ...r, status: 'error', error: errMsg } : r)
            )
            return
          }

          setGenerationResults((prev) =>
            prev.map((r) => {
              if (!r.modelId.startsWith(prefix)) return r
              const panelId = parseInt(r.modelId.split('_p')[1], 10)
              const panel   = data.panels!.find((p) => p.id === panelId)
              return panel ? { ...r, status: 'done', resultUrl: panel.url } : r
            })
          )
          if (typeof data.creditsRemaining === 'number') {
            setCreditsRemaining(data.creditsRemaining)
          }
        } catch {
          setGenerationResults((prev) =>
            prev.map((r) => r.modelId.startsWith(prefix)
              ? { ...r, status: 'error', error: t('errorConnection') }
              : r
            )
          )
        }
      })
    )
  }, [uploadedFile, generationResults, selectedTemplates, productType, aspectRatio, userPrompt, creditsRemaining, t])

  const isAnyGenerating = generationResults.some((r) => r.status === 'generating')
  const canGenerate     = !!uploadedFile && !isAnyGenerating && selectedTemplates.length > 0
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
                  ? t('chooseModels', { count: selectedTemplates.length, max: MAX_PARALLEL })
                  : t('chooseModelsEmpty')
              }
            />
            <div className="flex-1 bg-white rounded-2xl border border-cream-200 p-3 sm:p-4 shadow-soft">
              <TemplatePicker
                selectedIds={selectedTemplates}
                onSelect={handleTemplateSelect}
                maxSelect={MAX_PARALLEL}
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
              onAspectRatioChange={setAspectRatio}
              onGenerate={handleGenerate}
              onRetryFailed={handleRetryFailed}
              canGenerate={canGenerate}
              creditsRemaining={creditsRemaining}
              customModelUrls={customModelUrls}
              userPrompt={userPrompt}
              onUserPromptChange={setUserPrompt}
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
