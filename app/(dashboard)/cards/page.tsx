'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Header }             from '@/components/dashboard/header'
import { UploadZone }         from '@/components/generate/upload-zone'
import { CardProductForm }    from '@/components/cards/card-product-form'
import { CardTemplatePicker } from '@/components/cards/card-template-picker'
import { CardResultViewer, type CardResult } from '@/components/cards/card-result-viewer'
import { createClient }       from '@/lib/supabase/client'
import { MAX_CARD_TEMPLATES, CUSTOM_CARD_TEMPLATE_ID, AI_FREE_CARD_ID } from '@/lib/card-templates'

type AspectRatio = '1:1' | '4:5' | '9:16'
type MobileStep  = 1 | 2 | 3

const MOBILE_STEPS = [
  { id: 1 as MobileStep, label: 'Продукт'   },
  { id: 2 as MobileStep, label: 'Шаблон'    },
  { id: 3 as MobileStep, label: 'Результат' },
]

export default function CardsPage() {
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
  const [creditsRemaining,    setCreditsRemaining]    = useState<number | null>(null)
  const [mobileStep,          setMobileStep]          = useState<MobileStep>(1)

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
            setCreditsRemaining(profile.credits_remaining as number)
          }
        })
    })
  }, [])

  const handleUpload = useCallback(
    (file: File, url: string) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploadedFile(file)
      setPreviewUrl(url)
      setResults([])
      setMobileStep(2)
    },
    [previewUrl]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setResults([])
    setSelectedTemplates([])
  }, [previewUrl])

  const handleTemplateSelect = (ids: string[]) => {
    setSelectedTemplates(ids)
    if (ids.length > 0 && mobileStep === 2) setMobileStep(3)
  }

  const handleCustomTemplateChange = (file: File | null, url: string | null) => {
    if (customTemplateUrl) URL.revokeObjectURL(customTemplateUrl)
    setCustomTemplateFile(file)
    setCustomTemplateUrl(url)
  }

  const runGeneration = useCallback(
    async (templateIds: string[]) => {
      if (!uploadedFile || templateIds.length === 0) return

      // Sequential requests to avoid hitting Gemini rate limits
      for (let i = 0; i < templateIds.length; i++) {
        const templateId = templateIds[i]
        // Small delay between requests (skip before first)
        if (i > 0) await new Promise((r) => setTimeout(r, 3000))

        try {
          const fd = new FormData()
          fd.append('image',        uploadedFile)
          fd.append('template_id',  templateId)
          fd.append('aspect_ratio', aspectRatio)
          if (productName.trim())        fd.append('product_name',        productName.trim())
          if (brandName.trim())          fd.append('brand_name',          brandName.trim())
          if (productDescription.trim()) fd.append('product_description', productDescription.trim())
          if (templateId === AI_FREE_CARD_ID) {
            fd.append('generate_mode', 'card-free')
          }
          if (templateId === CUSTOM_CARD_TEMPLATE_ID && customTemplateFile) {
            fd.append('custom_template', customTemplateFile)
          }

          const res  = await fetch('/api/generate', { method: 'POST', body: fd })
          const data = await res.json()

          if (!res.ok) {
            setResults((prev) =>
              prev.map((r) =>
                r.templateId === templateId
                  ? { ...r, status: 'error', error: data.error ?? 'Ошибка генерации. Попробуйте снова.' }
                  : r
              )
            )
            continue
          }

          setResults((prev) =>
            prev.map((r) =>
              r.templateId === templateId
                ? { ...r, status: 'done', resultUrl: data.outputUrl }
                : r
            )
          )

          if (typeof data.creditsRemaining === 'number') {
            setCreditsRemaining(data.creditsRemaining)
          }
        } catch {
          setResults((prev) =>
            prev.map((r) =>
              r.templateId === templateId
                ? { ...r, status: 'error', error: 'Ошибка соединения. Проверьте интернет.' }
                : r
            )
          )
        }
      }
    },
    [uploadedFile, aspectRatio, productName, brandName, productDescription, customTemplateFile]
  )

  const handleGenerate = async () => {
    if (!uploadedFile || selectedTemplates.length === 0) return

    setResults(
      selectedTemplates.map((id) => ({
        templateId: id,
        status:     'generating',
        resultUrl:  null,
        error:      null,
      }))
    )
    setMobileStep(3)

    await runGeneration(selectedTemplates)
  }

  const handleRetryFailed = async () => {
    const failedIds = results
      .filter((r) => r.status === 'error')
      .map((r) => r.templateId)

    if (failedIds.length === 0) return

    setResults((prev) =>
      prev.map((r) =>
        failedIds.includes(r.templateId)
          ? { ...r, status: 'generating', error: null }
          : r
      )
    )

    await runGeneration(failedIds)
  }

  const isAnyGenerating = results.some((r) => r.status === 'generating')
  const step1Done       = !!previewUrl
  const step2Done       = selectedTemplates.length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Карточки товаров"
        subtitle="Загрузите продукт, выберите шаблон и получите готовую карточку для маркетплейса"
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      {/* ── Mobile step tabs ───────────────────────────────────────── */}
      <div className="lg:hidden sticky top-[60px] z-20 bg-white border-b border-cream-200 flex mt-3">
        {MOBILE_STEPS.map((step) => {
          const done   = step.id === 1 ? step1Done : step.id === 2 ? step2Done : false
          const active = mobileStep === step.id
          return (
            <button
              key={step.id}
              onClick={() => setMobileStep(step.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors touch-manipulation ${
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
            <SectionLabel step="01" title="Загрузите фото продукта" />
            <UploadZone
              previewUrl={previewUrl}
              onUpload={handleUpload}
              onRemove={handleRemove}
              dragLabel="Перетащите фото продукта"
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
              Сфотографируйте продукт на любом фоне
            </p>
          </div>

          {/* ── Column 2: Template ── */}
          <div className={`flex-col gap-3 ${mobileStep === 2 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel
              step="02"
              title={
                selectedTemplates.length > 0
                  ? `Выберите шаблон (${selectedTemplates.length}/${MAX_CARD_TEMPLATES})`
                  : 'Выберите шаблон карточки'
              }
            />
            <div className="flex-1 bg-white rounded-2xl border border-cream-200 p-3 sm:p-4 shadow-soft">
              <CardTemplatePicker
                selectedIds={selectedTemplates}
                onSelect={handleTemplateSelect}
                maxSelect={MAX_CARD_TEMPLATES}
                disabled={isAnyGenerating}
                customTemplateUrl={customTemplateUrl}
                onCustomTemplateChange={handleCustomTemplateChange}
              />
            </div>
          </div>

          {/* ── Column 3: Result ──── */}
          <div className={`flex-col gap-3 ${mobileStep === 3 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="03" title="Получите карточку" />
            <CardResultViewer
              results={results}
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
