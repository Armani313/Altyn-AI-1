'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check, Gem, Wind, Glasses, Shirt, Layers, Watch, ShoppingBag } from 'lucide-react'
import { Header }         from '@/components/dashboard/header'
import { UploadZone }     from '@/components/generate/upload-zone'
import { TemplatePicker } from '@/components/generate/template-picker'
import { ResultViewer, type GenerationResult } from '@/components/generate/result-viewer'
import { createClient }   from '@/lib/supabase/client'
import type { ProductType } from '@/lib/constants'

type AspectRatio = '1:1' | '9:16'
type MobileStep  = 1 | 2 | 3

const MAX_PARALLEL = 4

const MOBILE_STEPS = [
  { id: 1 as MobileStep, label: 'Фото'   },
  { id: 2 as MobileStep, label: 'Модели' },
  { id: 3 as MobileStep, label: 'Создать'},
]

const PRODUCT_TYPES: { id: ProductType; label: string; icon: React.ElementType }[] = [
  { id: 'jewelry',    label: 'Украшения',      icon: Gem         },
  { id: 'scarves',    label: 'Платки',          icon: Wind        },
  { id: 'headwear',   label: 'Гол. уборы',      icon: Glasses     },
  { id: 'outerwear',  label: 'Верх. одежда',    icon: Shirt       },
  { id: 'bottomwear', label: 'Низ. одежда',     icon: Layers      },
  { id: 'watches',    label: 'Часы',            icon: Watch       },
  { id: 'bags',       label: 'Сумки',           icon: ShoppingBag },
]

export default function DashboardPage() {
  const [previewUrl,         setPreviewUrl]         = useState<string | null>(null)
  const [uploadedFile,       setUploadedFile]       = useState<File | null>(null)
  const [productType,        setProductType]        = useState<ProductType>('jewelry')
  const [selectedTemplates,  setSelectedTemplates]  = useState<string[]>([])
  const [aspectRatio,        setAspectRatio]        = useState<AspectRatio>('1:1')
  const [generationResults,  setGenerationResults]  = useState<GenerationResult[]>([])
  const [creditsRemaining,   setCreditsRemaining]   = useState<number | null>(null)
  const [customModelUrls,    setCustomModelUrls]    = useState<string[]>([])
  const [mobileStep,         setMobileStep]         = useState<MobileStep>(1)
  const [userPrompt,         setUserPrompt]         = useState('')

  // Fetch credits on mount
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

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type)
    setSelectedTemplates([])
    setGenerationResults([])
  }

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
    if (ids.length > 0 && mobileStep === 2) {
      setMobileStep(3)
    }
  }

  // Core generation logic — runs for the given model IDs in parallel
  const runGeneration = useCallback(
    async (modelIds: string[]) => {
      if (!uploadedFile || modelIds.length === 0) return

      await Promise.allSettled(
        modelIds.map(async (modelId) => {
          try {
            const fd = new FormData()
            fd.append('image', uploadedFile)
            fd.append('model_id', modelId)
            fd.append('aspect_ratio', aspectRatio)
            fd.append('product_type', productType)
            if (userPrompt.trim()) fd.append('user_prompt', userPrompt.trim())

            const res  = await fetch('/api/generate', { method: 'POST', body: fd })
            const data = await res.json()

            if (!res.ok) {
              setGenerationResults((prev) =>
                prev.map((r) =>
                  r.modelId === modelId
                    ? { ...r, status: 'error', error: data.error ?? 'Ошибка генерации. Попробуйте снова.' }
                    : r
                )
              )
              return
            }

            setGenerationResults((prev) =>
              prev.map((r) =>
                r.modelId === modelId
                  ? { ...r, status: 'done', resultUrl: data.outputUrl }
                  : r
              )
            )

            if (typeof data.creditsRemaining === 'number') {
              setCreditsRemaining(data.creditsRemaining)
            }
          } catch {
            setGenerationResults((prev) =>
              prev.map((r) =>
                r.modelId === modelId
                  ? { ...r, status: 'error', error: 'Ошибка соединения. Проверьте интернет.' }
                  : r
              )
            )
          }
        })
      )
    },
    [uploadedFile, aspectRatio, productType, userPrompt]
  )

  const handleGenerate = async () => {
    if (!uploadedFile || selectedTemplates.length === 0) return

    setGenerationResults(
      selectedTemplates.map((id) => ({
        modelId:   id,
        status:    'generating',
        resultUrl: null,
        error:     null,
      }))
    )
    setMobileStep(3)

    await runGeneration(selectedTemplates)
  }

  const handleRetryFailed = async () => {
    const failedIds = generationResults
      .filter((r) => r.status === 'error')
      .map((r) => r.modelId)

    if (failedIds.length === 0) return

    setGenerationResults((prev) =>
      prev.map((r) =>
        failedIds.includes(r.modelId)
          ? { ...r, status: 'generating', error: null }
          : r
      )
    )

    await runGeneration(failedIds)
  }

  const isAnyGenerating = generationResults.some((r) => r.status === 'generating')
  const step1Done = !!previewUrl
  const step2Done = selectedTemplates.length > 0

  const UPLOAD_LABELS: Record<ProductType, string> = {
    jewelry:    'Загрузите фото украшения',
    scarves:    'Загрузите фото платка',
    headwear:   'Загрузите фото аксессуара',
    outerwear:  'Загрузите фото одежды',
    bottomwear: 'Загрузите фото одежды',
    watches:    'Загрузите фото часов',
    bags:       'Загрузите фото сумки',
  }
  const UPLOAD_HINTS: Record<ProductType, string> = {
    jewelry:    'Сфотографируйте украшение на любом фоне',
    scarves:    'Сфотографируйте платок или шаль на любом фоне',
    headwear:   'Сфотографируйте очки или аксессуар для волос',
    outerwear:  'Сфотографируйте куртку, пальто или блузу',
    bottomwear: 'Сфотографируйте юбку, брюки или шорты',
    watches:    'Сфотографируйте часы или браслет на любом фоне',
    bags:       'Сфотографируйте сумку или клатч на любом фоне',
  }
  const DRAG_LABELS: Record<ProductType, string> = {
    jewelry:    'Перетащите фото украшения',
    scarves:    'Перетащите фото платка',
    headwear:   'Перетащите фото аксессуара',
    outerwear:  'Перетащите фото одежды',
    bottomwear: 'Перетащите фото одежды',
    watches:    'Перетащите фото часов',
    bags:       'Перетащите фото сумки',
  }
  const uploadLabel = UPLOAD_LABELS[productType]
  const uploadHint  = UPLOAD_HINTS[productType]
  const dragLabel   = DRAG_LABELS[productType]

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Лайфстайл фото"
        subtitle="Загрузите товар, выберите модели и получите лайфстайл-фото"
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      {/* ── Product type switcher ──────────────────────────────────────── */}
      <div className="px-3 sm:px-5 xl:px-6 pt-3 sm:pt-5">
        <div className="max-w-[1400px] mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 p-1 bg-cream-100 rounded-2xl border border-cream-200 min-w-max">
            {PRODUCT_TYPES.map((type) => {
              const Icon   = type.icon
              const active = productType === type.id
              return (
                <button
                  key={type.id}
                  onClick={() => handleProductTypeChange(type.id)}
                  disabled={isAnyGenerating}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 disabled:opacity-60 ${
                    active
                      ? 'bg-white text-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Mobile step tabs ──────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-[57px] z-20 bg-white border-b border-cream-200 flex mt-3">
        {MOBILE_STEPS.map((step) => {
          const done   = step.id === 1 ? step1Done : step.id === 2 ? step2Done : false
          const active = mobileStep === step.id
          return (
            <button
              key={step.id}
              onClick={() => setMobileStep(step.id)}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors touch-manipulation ${
                active
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground'
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
            <p className="text-xs text-muted-foreground text-center">
              {uploadHint}
            </p>
          </div>

          {/* ── Column 2: Templates ── */}
          <div className={`flex-col gap-3 ${mobileStep === 2 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel
              step="02"
              title={
                selectedTemplates.length > 0
                  ? `Выберите модели (${selectedTemplates.length}/${MAX_PARALLEL})`
                  : 'Выберите модели'
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
            <SectionLabel step="03" title="Получите результат" />
            <ResultViewer
              results={generationResults}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              onGenerate={handleGenerate}
              onRetryFailed={handleRetryFailed}
              canGenerate={!!uploadedFile && !isAnyGenerating}
              selectedCount={selectedTemplates.length}
              creditsRemaining={creditsRemaining}
              customModelUrls={customModelUrls}
              userPrompt={userPrompt}
              onUserPromptChange={setUserPrompt}
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
