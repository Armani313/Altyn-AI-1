'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Header }             from '@/components/dashboard/header'
import { UploadZone }         from '@/components/generate/upload-zone'
import { CardProductForm }    from '@/components/cards/card-product-form'
import { CardTemplatePicker } from '@/components/cards/card-template-picker'
import { CardResultViewer, type CardResult } from '@/components/cards/card-result-viewer'
import { createClient }       from '@/lib/supabase/client'
import { useDashboardProfile } from '@/components/dashboard/dashboard-profile-provider'
import {
  type CardTemplate,
  MAX_CARD_TEMPLATES,
} from '@/lib/card-templates'
import { getCardsStore } from '@/lib/cards-generation-store'

type AspectRatio = '1:1' | '4:5' | '9:16'
type MobileStep  = 1 | 2 | 3

export default function CardsPage() {
  const t = useTranslations('cards')
  const dashboardProfile = useDashboardProfile()
  const currentPlan = dashboardProfile?.profile?.plan ?? 'free'
  const providerCreditsRemaining = dashboardProfile?.profile?.credits_remaining ?? null
  const setDashboardCreditsRemaining = dashboardProfile?.setCreditsRemaining

  const MOBILE_STEPS = [
    { id: 1 as MobileStep, label: t('mobileStep1') },
    { id: 2 as MobileStep, label: t('mobileStep2') },
    { id: 3 as MobileStep, label: t('mobileStep3') },
  ]

  const [previewUrl,          setPreviewUrl]          = useState<string | null>(null)
  const [uploadedFile,        setUploadedFile]        = useState<File | null>(null)
  const [productName,         setProductName]         = useState('')
  const [brandName,           setBrandName]           = useState('')
  const [productDescription,  setProductDescription]  = useState('')
  const [selectedTemplates,   setSelectedTemplates]   = useState<string[]>([])
  const [customTemplateFile,  setCustomTemplateFile]  = useState<File | null>(null)
  const [customTemplateUrl,   setCustomTemplateUrl]   = useState<string | null>(null)
  const [aspectRatio,         setAspectRatio]         = useState<AspectRatio>('1:1')
  const [results,             setResults]             = useState<CardResult[]>([])
  const [localCreditsRemaining, setLocalCreditsRemaining] = useState<number | null>(null)
  const [mobileStep,          setMobileStep]          = useState<MobileStep>(1)
  const [cardTemplates,       setCardTemplates]       = useState<CardTemplate[]>([])
  const [templateMap,         setTemplateMap]         = useState<Record<string, CardTemplate>>({})
  const creditsRemaining = localCreditsRemaining ?? providerCreditsRemaining

  const setCreditsRef = useRef(setLocalCreditsRemaining)
  useEffect(() => { setCreditsRef.current = setLocalCreditsRemaining }, [])

  useEffect(() => {
    const store = getCardsStore()
    setResults(store.results)
    const unsubscribe = store.subscribe((newResults, newCredits) => {
      setResults(newResults)
      if (typeof newCredits === 'number') {
        setCreditsRef.current(newCredits)
        setDashboardCreditsRemaining?.(newCredits)
      }
    })
    return unsubscribe
  }, [setDashboardCreditsRemaining])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cards:form')
      if (!stored) return
      const f = JSON.parse(stored) as {
        productName?: string; brandName?: string; productDescription?: string
        selectedTemplates?: string[]; aspectRatio?: AspectRatio
      }
      if (f.productName)        setProductName(f.productName)
      if (f.brandName)          setBrandName(f.brandName)
      if (f.productDescription) setProductDescription(f.productDescription)
      if (f.selectedTemplates)  setSelectedTemplates(f.selectedTemplates)
      if (f.aspectRatio)        setAspectRatio(f.aspectRatio)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem('cards:form', JSON.stringify({
        productName, brandName, productDescription, selectedTemplates, aspectRatio,
      }))
    } catch { /* ignore */ }
  }, [productName, brandName, productDescription, selectedTemplates, aspectRatio])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('credits_remaining')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const profile = data as any
          if (profile?.credits_remaining != null) {
            setLocalCreditsRemaining(profile.credits_remaining as number)
            setDashboardCreditsRemaining?.(profile.credits_remaining as number)
          }
        })
    })
  }, [setDashboardCreditsRemaining])

  useEffect(() => {
    fetch('/api/card-templates')
      .then((r) => r.json())
      .then((data: CardTemplate[]) => {
        if (Array.isArray(data)) {
          setCardTemplates(data)
          setTemplateMap(Object.fromEntries(data.map((tpl) => [tpl.id, tpl])))
        }
      })
      .catch(() => { /* templates stay empty */ })
  }, [])

  const handleUpload = useCallback(
    (file: File, url: string) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadedFile(file)
      setPreviewUrl(url)
      setMobileStep(2)
    },
    [previewUrl]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setSelectedTemplates([])
    getCardsStore().clearAll()
  }, [previewUrl])

  const handleTemplateSelect = (ids: string[]) => {
    setSelectedTemplates(ids)
    if (ids.length > 0 && mobileStep === 2) {
      setMobileStep(3)
      return
    }

    if (ids.length === 0 && previewUrl) {
      setMobileStep(2)
    }
  }

  const handleCustomTemplateChange = (file: File | null, url: string | null) => {
    if (customTemplateUrl) URL.revokeObjectURL(customTemplateUrl)
    setCustomTemplateFile(file)
    setCustomTemplateUrl(url)
  }

  const handleGenerate = () => {
    if (!uploadedFile || selectedTemplates.length === 0) return
    setMobileStep(3)
    getCardsStore().startGeneration({
      templateIds:        selectedTemplates,
      file:               uploadedFile!,
      customFile:         customTemplateFile,
      aspectRatio,
      productName,
      brandName,
      productDescription,
    })
  }

  const handleRetryFailed = () => {
    getCardsStore().retryFailed({
      file:               uploadedFile,
      customFile:         customTemplateFile,
      aspectRatio,
      productName,
      brandName,
      productDescription,
    })
  }

  const isAnyGenerating = results.some((r) => r.status === 'generating')
  const step1Done       = !!previewUrl
  const step2Done       = selectedTemplates.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      {/* ── Mobile step tabs ───────────────────────────────────────── */}
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

      {/* ── Workspace ──────────────────────────────────────────────── */}
      <div className="flex-1 p-3 sm:p-5 xl:p-6">
        <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_1.15fr_1fr] gap-3 sm:gap-5">

          {/* ── Column 1: Product ─── */}
          <div className={`flex-col gap-3 ${mobileStep === 1 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="01" title={t('step1')} />
            <UploadZone
              previewUrl={previewUrl}
              onUpload={handleUpload}
              onRemove={handleRemove}
              dragLabel={t('dragLabel')}
            />
            <div className="bg-white rounded-2xl border border-cream-200 p-4 shadow-soft">
              <CardProductForm
                productName={productName}
                brandName={brandName}
                productDescription={productDescription}
                onProductNameChange={setProductName}
                onBrandNameChange={setBrandName}
                onProductDescriptionChange={setProductDescription}
                disabled={isAnyGenerating}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {t('uploadHint')}
            </p>
          </div>

          {/* ── Column 2: Template ── */}
          <div className={`flex-col gap-3 ${mobileStep === 2 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel
              step="02"
              title={
                selectedTemplates.length > 0
                  ? t('step2Label', { count: selectedTemplates.length, max: MAX_CARD_TEMPLATES })
                  : t('step2Empty')
              }
            />
            <div className="flex-1 bg-white rounded-2xl border border-cream-200 p-3 sm:p-4 shadow-soft">
              <CardTemplatePicker
                templates={cardTemplates}
                selectedIds={selectedTemplates}
                onSelect={handleTemplateSelect}
                maxSelect={MAX_CARD_TEMPLATES}
                disabled={isAnyGenerating}
                currentPlan={currentPlan}
                customTemplateUrl={customTemplateUrl}
                onCustomTemplateChange={handleCustomTemplateChange}
              />
            </div>
          </div>

          {/* ── Column 3: Result ──── */}
          <div className={`flex-col gap-3 ${mobileStep === 3 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="03" title={t('step3')} />
            <CardResultViewer
              results={results}
              templateMap={templateMap}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              onGenerate={handleGenerate}
              onRetryFailed={handleRetryFailed}
              canGenerate={!!uploadedFile && !isAnyGenerating}
              selectedCount={selectedTemplates.length}
              creditsRemaining={creditsRemaining}
            />
          </div>

        </div>
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
