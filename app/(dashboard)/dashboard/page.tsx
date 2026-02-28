'use client'

import { useState, useCallback, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Header } from '@/components/dashboard/header'
import { UploadZone } from '@/components/generate/upload-zone'
import { TemplatePicker } from '@/components/generate/template-picker'
import { ResultViewer } from '@/components/generate/result-viewer'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATE_CATEGORY_MAP, MODEL_PHOTO_MAP } from '@/components/generate/template-picker'

type AspectRatio = '1:1' | '9:16'
type MobileStep = 1 | 2 | 3

const MOBILE_STEPS = [
  { id: 1 as MobileStep, label: 'Фото'   },
  { id: 2 as MobileStep, label: 'Модель' },
  { id: 3 as MobileStep, label: 'Создать'},
]

export default function DashboardPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [mobileStep, setMobileStep] = useState<MobileStep>(1)

  // Fetch credits on mount so the header shows the real balance
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
      setResultUrl(null)
      setGenerateError(null)
      // Auto-advance to model selection on mobile
      setMobileStep(2)
    },
    [previewUrl]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setGenerateError(null)
  }, [previewUrl])

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id)
    // Auto-advance to generate step on mobile
    setMobileStep(3)
  }

  const handleGenerate = async () => {
    if (!uploadedFile) return

    setIsGenerating(true)
    setResultUrl(null)
    setGenerateError(null)

    try {
      const formData = new FormData()
      formData.append('image', uploadedFile)
      if (selectedTemplate) {
        formData.append('model_id', selectedTemplate)
        const category = MODEL_PHOTO_MAP[selectedTemplate]?.category
          ?? TEMPLATE_CATEGORY_MAP[selectedTemplate]
          ?? 'rings'
        formData.append('template_category', category)
      }
      formData.append('aspect_ratio', aspectRatio)

      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setGenerateError(data.error ?? 'Ошибка генерации. Попробуйте снова.')
        return
      }

      setResultUrl(data.outputUrl)
      if (typeof data.creditsRemaining === 'number') {
        setCreditsRemaining(data.creditsRemaining)
      }
    } catch {
      setGenerateError('Ошибка соединения. Проверьте интернет и попробуйте снова.')
    } finally {
      setIsGenerating(false)
    }
  }

  const step1Done = !!previewUrl
  const step2Done = !!selectedTemplate

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="Создать контент"
        subtitle="Загрузите украшение, выберите модель и получите лайфстайл-фото"
        profile={creditsRemaining != null ? { credits_remaining: creditsRemaining } : null}
      />

      {/* ── Mobile step tabs ──────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-[57px] z-20 bg-white border-b border-cream-200 flex">
        {MOBILE_STEPS.map((step) => {
          const done    = step.id === 1 ? step1Done : step.id === 2 ? step2Done : false
          const active  = mobileStep === step.id
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
                done
                  ? 'bg-emerald-400 text-white'
                  : active
                  ? 'gradient-rose-gold text-white'
                  : 'bg-cream-200 text-muted-foreground'
              }`}>
                {done ? <Check className="w-3 h-3" /> : step.id}
              </span>
              {step.label}
            </button>
          )
        })}
      </div>

      {/* ── Workspace ─────────────────────────────────────────────────── */}
      <div className="flex-1 p-3 sm:p-5 xl:p-6">
        <div className="max-w-[1400px] mx-auto h-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_1.15fr_1fr] gap-3 sm:gap-5">

          {/* ── Column 1: Upload ──── */}
          <div className={`flex-col gap-3 ${mobileStep === 1 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="01" title="Загрузите фото" />
            <UploadZone
              previewUrl={previewUrl}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
            <p className="text-xs text-muted-foreground text-center">
              Сфотографируйте украшение на любом фоне
            </p>
          </div>

          {/* ── Column 2: Templates ── */}
          <div className={`flex-col gap-3 ${mobileStep === 2 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="02" title="Выберите модель" />
            <div className="flex-1 bg-white rounded-2xl border border-cream-200 p-3 sm:p-4 shadow-soft">
              <TemplatePicker
                selectedId={selectedTemplate}
                onSelect={handleTemplateSelect}
              />
            </div>
          </div>

          {/* ── Column 3: Result ──── */}
          <div className={`flex-col gap-3 ${mobileStep === 3 ? 'flex' : 'hidden lg:flex'}`}>
            <SectionLabel step="03" title="Получите результат" />
            <ResultViewer
              isGenerating={isGenerating}
              resultUrl={resultUrl}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              onGenerate={handleGenerate}
              canGenerate={!!uploadedFile}
            />
            {generateError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{generateError}</p>
              </div>
            )}
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
