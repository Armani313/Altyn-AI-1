'use client'

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { EASE } from '@/lib/motion'
import type { LocalizedTopazTool } from '@/lib/tools/topaz-tools'

type ProcessStatus = 'idle' | 'processing' | 'done' | 'error'
type ZoomTarget = 'before' | 'after' | null
type ScaleMode = '2x' | '4x'

interface ImageDimensions {
  width: number
  height: number
}

interface ToolApiError {
  error?: string
  code?: string
}

interface TopazToolPageProps {
  tool: LocalizedTopazTool
  relatedTools: LocalizedTopazTool[]
  locale: 'en' | 'ru'
}

const SAMPLE_IMAGES = [
  '/examples/hf_20260309_090944_181c07c5-1859-48f5-adcb-adad853a4359.jpeg',
  '/examples/hf_20260309_100705_5ae3050b-b4c2-41f8-8321-fe15ee688dd2.jpeg',
  '/examples/hf_20260309_101146_d00781c1-567e-44ef-b3e0-3375aea94882.jpeg',
  '/examples/hf_20260309_102108_ba7dc28c-782e-425b-a9d5-e76c8d0b9120.jpeg',
]

async function getImageDimensions(src: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Failed to read image dimensions.'))
    image.src = src
  })
}

function formatResolution(dimensions: ImageDimensions | null): string {
  if (!dimensions) return '—'
  return `${dimensions.width} × ${dimensions.height}px`
}

function estimateOutputMp(dimensions: ImageDimensions | null, scaleMode: ScaleMode): string {
  if (!dimensions) return '—'
  const factor = scaleMode === '4x' ? 4 : 2
  const pixels = dimensions.width * dimensions.height * factor * factor
  return `${(pixels / 1_000_000).toFixed(1)} MP`
}

export function TopazToolPage({ tool, relatedTools, locale }: TopazToolPageProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [inputDimensions, setInputDimensions] = useState<ImageDimensions | null>(null)
  const [outputDimensions, setOutputDimensions] = useState<ImageDimensions | null>(null)
  const [scaleMode, setScaleMode] = useState<ScaleMode>(tool.defaultScale ?? '2x')
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [zoomTarget, setZoomTarget] = useState<ZoomTarget>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const requestAbortRef = useRef<AbortController | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const resultUrlRef = useRef<string | null>(null)

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const revokeObjectUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  const resetResult = useCallback(() => {
    revokeObjectUrl(resultUrlRef.current)
    resultUrlRef.current = null
    setResultUrl(null)
    setOutputDimensions(null)
  }, [revokeObjectUrl])

  const startProgressSimulation = useCallback(() => {
    clearProgressTimer()
    setProgress(8)
    progressTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current
        return Math.min(92, current + Math.max(3, Math.round((100 - current) / 6)))
      })
    }, 650)
  }, [clearProgressTimer])

  const getFriendlyErrorMessage = useCallback((payload: ToolApiError | null) => {
    switch (payload?.code) {
      case 'rate_limited':
        return locale === 'ru' ? 'Слишком много запросов. Попробуйте немного позже.' : 'Too many requests. Please try again a bit later.'
      case 'file_too_large':
        return locale === 'ru' ? 'Файл слишком большой для обработки.' : 'The file is too large to process.'
      case 'invalid_image':
      case 'unsupported_format':
        return locale === 'ru' ? 'Загрузите корректное изображение в формате JPG, PNG, WEBP или HEIC.' : 'Please upload a valid JPG, PNG, WEBP, or HEIC image.'
      case 'output_limit_mp':
        return locale === 'ru' ? 'Итоговый размер выходит за лимит 32 MP. Выберите меньшее увеличение.' : 'The output exceeds the 32 MP limit. Choose a smaller scale.'
      case 'output_limit_edge':
        return locale === 'ru' ? 'Итоговый размер по стороне слишком большой. Выберите меньшее увеличение.' : 'The output edge is too large. Choose a smaller scale.'
      case 'queue_busy':
        return locale === 'ru' ? 'Сервис сейчас занят. Попробуйте ещё раз немного позже.' : 'The service is busy right now. Please try again shortly.'
      case 'provider_not_configured':
        return locale === 'ru' ? 'Инструмент пока не настроен на сервере.' : 'The tool is not configured on the server yet.'
      case 'provider_auth':
        return locale === 'ru' ? 'Сервис обработки отклонил запрос.' : 'The processing provider rejected the request.'
      case 'provider_rate_limit':
        return locale === 'ru' ? 'Внешний сервис временно ограничил запросы.' : 'The external service is temporarily rate-limiting requests.'
      case 'provider_timeout':
        return locale === 'ru' ? 'Обработка заняла слишком много времени. Попробуйте другое изображение.' : 'Processing took too long. Please try a different image.'
      case 'tool_unavailable':
        return locale === 'ru' ? 'Инструмент пока недоступен.' : 'This tool is not available yet.'
      default:
        return payload?.error || (locale === 'ru' ? 'Не удалось обработать изображение.' : 'Could not process the image.')
    }
  }, [locale])

  const runProcessing = useCallback(async (file: File, nextScale: ScaleMode) => {
    requestAbortRef.current?.abort()
    clearProgressTimer()
    resetResult()

    const controller = new AbortController()
    requestAbortRef.current = controller

    setProcessStatus('processing')
    setErrorMsg('')
    startProgressSimulation()

    try {
      const formData = new FormData()
      formData.append('toolSlug', tool.slug)
      formData.append('image', file)
      if (tool.heroMode === 'scale') {
        formData.append('scale', nextScale)
      }

      const response = await fetch('/api/tools/topaz-image', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as ToolApiError | null
        throw new Error(getFriendlyErrorMessage(payload))
      }

      const imageBlob = await response.blob()
      const nextResultUrl = URL.createObjectURL(imageBlob)
      const nextOutputDimensions = await getImageDimensions(nextResultUrl)

      resultUrlRef.current = nextResultUrl
      setResultUrl(nextResultUrl)
      setOutputDimensions(nextOutputDimensions)
      setProcessStatus('done')
      setProgress(100)
    } catch (error) {
      if (controller.signal.aborted) return
      setProcessStatus('error')
      setProgress(0)
      setErrorMsg(error instanceof Error ? error.message : getFriendlyErrorMessage(null))
    } finally {
      clearProgressTimer()
      if (!controller.signal.aborted) {
        requestAbortRef.current = null
      }
    }
  }, [clearProgressTimer, getFriendlyErrorMessage, resetResult, startProgressSimulation, tool.heroMode, tool.slug])

  const handleUpload = useCallback(async (file: File, nextScale: ScaleMode = scaleMode) => {
    if (!file.type.startsWith('image/')) return

    requestAbortRef.current?.abort()
    clearProgressTimer()
    revokeObjectUrl(previewUrlRef.current)
    resetResult()

    const nextPreviewUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextPreviewUrl
    setUploadedFile(file)
    setPreviewUrl(nextPreviewUrl)
    setProcessStatus('idle')
    setErrorMsg('')
    setScaleMode(nextScale)

    try {
      setInputDimensions(await getImageDimensions(nextPreviewUrl))
    } catch {
      setInputDimensions(null)
    }

    await runProcessing(file, nextScale)
  }, [clearProgressTimer, resetResult, revokeObjectUrl, runProcessing, scaleMode])

  const handleSampleClick = useCallback(async (src: string) => {
    const response = await fetch(src)
    const blob = await response.blob()
    const file = new File([blob], 'sample.jpeg', { type: blob.type || 'image/jpeg' })
    await handleUpload(file)
  }, [handleUpload])

  const handleScaleChange = useCallback(async (nextScale: ScaleMode) => {
    setScaleMode(nextScale)
    if (!uploadedFile || tool.heroMode !== 'scale') return
    await runProcessing(uploadedFile, nextScale)
  }, [runProcessing, tool.heroMode, uploadedFile])

  const handleDownload = useCallback(() => {
    if (!resultUrl) return
    const anchor = document.createElement('a')
    anchor.href = resultUrl
    anchor.download = `${tool.slug}-${tool.heroMode === 'scale' ? scaleMode : 'processed'}.png`
    anchor.click()
  }, [resultUrl, scaleMode, tool.heroMode, tool.slug])

  const handleReset = useCallback(() => {
    requestAbortRef.current?.abort()
    requestAbortRef.current = null
    clearProgressTimer()
    revokeObjectUrl(previewUrlRef.current)
    revokeObjectUrl(resultUrlRef.current)
    previewUrlRef.current = null
    resultUrlRef.current = null
    setUploadedFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setInputDimensions(null)
    setOutputDimensions(null)
    setProcessStatus('idle')
    setProgress(0)
    setErrorMsg('')
    setZoomTarget(null)
  }, [clearProgressTimer, revokeObjectUrl])

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void handleUpload(file)
  }, [handleUpload])

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort()
      clearProgressTimer()
      revokeObjectUrl(previewUrlRef.current)
      revokeObjectUrl(resultUrlRef.current)
    }
  }, [clearProgressTimer, revokeObjectUrl])

  const isProcessing = processStatus === 'processing'
  const hasResult = Boolean(resultUrl)
  const zoomImageUrl = zoomTarget === 'before' ? previewUrl : resultUrl
  const zoomTitle = zoomTarget === 'before'
    ? (locale === 'ru' ? 'Исходное изображение' : 'Source image')
    : tool.resultLabel
  const zoomDimensions = zoomTarget === 'before' ? inputDimensions : outputDimensions

  return (
    <>
      <Dialog open={zoomTarget !== null} onOpenChange={(open) => !open && setZoomTarget(null)}>
        <DialogContent className="max-w-5xl border-cream-200 bg-white p-4 shadow-card sm:rounded-[1.5rem] sm:p-5">
          <div className="pr-10">
            <DialogTitle className="font-serif text-2xl font-medium text-foreground">
              {zoomTitle}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {zoomDimensions ? formatResolution(zoomDimensions) : (locale === 'ru' ? 'Крупный просмотр' : 'Large preview')}
            </DialogDescription>
          </div>
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-cream-200 bg-cream-50 p-3">
            {zoomImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={zoomImageUrl} alt={zoomTitle} className="max-h-[75vh] w-full rounded-xl object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <section className="relative overflow-hidden px-6 pb-16 pt-28">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-20 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-rose-gold-100/80 via-rose-gold-50/40 to-transparent blur-3xl" />
          <div className="absolute bottom-0 right-[-5%] h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-cream-200/70 via-cream-100/30 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-gold-700 shadow-soft backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {tool.badge}
            </span>
            <h1 className="mb-4 font-serif text-[clamp(2.2rem,5vw,3.7rem)] font-medium leading-tight tracking-tight text-foreground">
              {tool.title}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {tool.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {tool.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-full border border-cream-300 bg-white/85 px-4 py-2 text-sm text-foreground shadow-soft"
                >
                  {highlight}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="rounded-[2rem] border border-cream-300/80 bg-white/90 p-4 shadow-card backdrop-blur sm:p-6"
          >
            {tool.status === 'live' ? (
              !uploadedFile ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div
                    className={`group relative rounded-[1.5rem] border-2 border-dashed p-10 text-center transition-all sm:p-14 ${
                      isDragging
                        ? 'border-rose-gold-400 bg-rose-gold-50/70'
                        : 'border-cream-300 bg-cream-50/70 hover:border-rose-gold-300 hover:bg-white'
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => document.getElementById(`${tool.slug}-upload`)?.click()}
                  >
                    <input
                      id={`${tool.slug}-upload`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleUpload(file)
                      }}
                    />
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 shadow-soft">
                      <Upload className="h-7 w-7 text-rose-gold-700" />
                    </div>
                    <h2 className="mb-3 font-serif text-2xl font-medium text-foreground">
                      {tool.uploadTitle}
                    </h2>
                    <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {tool.uploadBody}
                    </p>
                    <Button
                      size="lg"
                      className="pointer-events-none h-12 rounded-xl bg-primary px-8 text-white shadow-soft hover:bg-rose-gold-600 hover:shadow-glow"
                    >
                      {tool.uploadButton}
                    </Button>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {locale === 'ru' ? 'Или перетащите файл сюда' : 'Or drag and drop a file here'}
                    </p>
                  </div>

                  <div className="rounded-[1.5rem] border border-cream-200 bg-gradient-to-br from-[#FFFDFC] via-white to-rose-gold-50/40 p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-gold-100">
                        <Wand2 className="h-5 w-5 text-rose-gold-700" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-medium text-foreground">{tool.featureTitle}</h3>
                        <p className="text-sm text-muted-foreground">{tool.featureIntro}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {tool.highlights.map((point) => (
                        <div
                          key={point}
                          className="flex items-start gap-3 rounded-2xl border border-cream-200 bg-white/80 px-4 py-3"
                        >
                          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-gold-600" />
                          <span className="text-sm leading-relaxed text-foreground">{point}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[1.25rem] border border-amber-200 bg-amber-50/90 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100">
                          <AlertTriangle className="h-4 w-4 text-amber-700" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-950">
                            {locale === 'ru' ? 'Лимит обработки' : 'Processing limit'}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                            {tool.limitNote}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <p className="mb-4 text-sm text-muted-foreground">
                        {locale === 'ru' ? 'Можно протестировать и на примере:' : 'You can also test with a sample:'}
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {SAMPLE_IMAGES.map((src, index) => (
                          <button
                            key={src}
                            onClick={() => void handleSampleClick(src)}
                            className="overflow-hidden rounded-2xl border-2 border-cream-200 transition-all duration-200 hover:scale-[1.03] hover:border-rose-gold-300"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Sample ${index + 1}`} className="h-20 w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="overflow-hidden rounded-[1.5rem] border border-cream-200 bg-white">
                    <div className="grid min-h-[420px] md:grid-cols-2">
                      <div className="border-b border-cream-200 p-6 md:border-b-0 md:border-r">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="inline-flex rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {locale === 'ru' ? 'До' : 'Before'}
                          </span>
                          {previewUrl && (
                            <button
                              type="button"
                              onClick={() => setZoomTarget('before')}
                              className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                              {locale === 'ru' ? 'Открыть крупно' : 'Open large view'}
                            </button>
                          )}
                        </div>
                        <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-cream-50 p-4">
                          {previewUrl && (
                            <button type="button" onClick={() => setZoomTarget('before')} className="group relative block w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewUrl}
                                alt={locale === 'ru' ? 'Исходник' : 'Source'}
                                className="max-h-[320px] max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative p-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="inline-flex rounded-full bg-rose-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-gold-700">
                            {locale === 'ru' ? 'После' : 'After'}
                          </span>
                          {hasResult && resultUrl && (
                            <button
                              type="button"
                              onClick={() => setZoomTarget('after')}
                              className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                            >
                              <Maximize2 className="h-3.5 w-3.5" />
                              {locale === 'ru' ? 'Открыть крупно' : 'Open large view'}
                            </button>
                          )}
                        </div>
                        <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-gradient-to-br from-cream-50 via-white to-rose-gold-50/40 p-4">
                          {isProcessing && (
                            <div className="flex max-w-xs flex-col items-center gap-4 text-center">
                              <Loader2 className="h-10 w-10 animate-spin text-rose-gold-500" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {tool.processingTitle} {progress > 0 ? `${progress}%` : ''}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">{tool.processingHint}</p>
                              </div>
                              <div className="w-full overflow-hidden rounded-full bg-cream-300">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-rose-gold-400 via-rose-gold-500 to-rose-gold-600 transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {hasResult && !isProcessing && resultUrl && (
                            <button type="button" onClick={() => setZoomTarget('after')} className="group relative block w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={resultUrl}
                                alt={tool.resultLabel}
                                className="max-h-[320px] max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                              />
                            </button>
                          )}

                          {processStatus === 'error' && !isProcessing && (
                            <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                              <AlertTriangle className="h-10 w-10 text-destructive" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {locale === 'ru' ? 'Не удалось обработать изображение' : 'Could not process the image'}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-cream-200 bg-white p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-gold-100">
                        <CheckCircle2 className="h-5 w-5 text-rose-gold-700" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-medium text-foreground">{tool.resultLabel}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tool.heroMode === 'scale'
                            ? locale === 'ru'
                              ? `Итоговый размер: ${estimateOutputMp(inputDimensions, scaleMode)}`
                              : `Estimated output: ${estimateOutputMp(inputDimensions, scaleMode)}`
                            : locale === 'ru'
                              ? 'Результат без лишних ручных шагов'
                              : 'Result without extra manual steps'}
                        </p>
                      </div>
                    </div>

                    {tool.heroMode === 'scale' && (
                      <div className="mb-6 grid grid-cols-2 gap-3">
                        {(['2x', '4x'] as const).map((scale) => {
                          const active = scaleMode === scale
                          return (
                            <button
                              key={scale}
                              type="button"
                              onClick={() => void handleScaleChange(scale)}
                              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                                active
                                  ? 'border-rose-gold-300 bg-rose-gold-50 text-rose-gold-700 shadow-soft'
                                  : 'border-cream-200 bg-white text-foreground hover:border-rose-gold-200'
                              }`}
                            >
                              <div className="font-medium">{scale}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {scale === '2x'
                                  ? locale === 'ru'
                                    ? 'Быстрее и мягче'
                                    : 'Faster and lighter'
                                  : locale === 'ru'
                                    ? 'Крупнее итог'
                                    : 'Larger output'}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <div className="space-y-3 rounded-[1.25rem] border border-cream-200 bg-cream-50/70 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{locale === 'ru' ? 'Исходник' : 'Input'}</span>
                        <span className="font-medium text-foreground">{formatResolution(inputDimensions)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{locale === 'ru' ? 'Результат' : 'Output'}</span>
                        <span className="font-medium text-foreground">
                          {tool.heroMode === 'scale' ? estimateOutputMp(inputDimensions, scaleMode) : formatResolution(outputDimensions)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Button
                        type="button"
                        onClick={handleDownload}
                        disabled={!hasResult}
                        className="h-12 rounded-xl bg-primary text-white shadow-soft hover:bg-rose-gold-600"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {locale === 'ru' ? 'Скачать результат' : 'Download result'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => uploadedFile && void runProcessing(uploadedFile, scaleMode)}
                        disabled={!uploadedFile || isProcessing}
                        className="h-12 rounded-xl border-cream-200"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {locale === 'ru' ? 'Запустить ещё раз' : 'Run again'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        className="h-12 rounded-xl"
                      >
                        {locale === 'ru' ? 'Загрузить другое фото' : 'Upload another image'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.5rem] border border-cream-200 bg-gradient-to-br from-[#FFFDFC] via-white to-rose-gold-50/40 p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-gold-100">
                      <Wand2 className="h-5 w-5 text-rose-gold-700" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl font-medium text-foreground">{tool.comingSoonTitle}</h2>
                      <p className="text-sm text-muted-foreground">{tool.comingSoonBody}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tool.comingSoonPoints.map((point) => (
                      <div
                        key={point}
                        className="flex items-start gap-3 rounded-2xl border border-cream-200 bg-white/80 px-4 py-3"
                      >
                        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-gold-600" />
                        <span className="text-sm leading-relaxed text-foreground">{point}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <Link href="/register">
                      <Button size="lg" className="h-12 rounded-xl bg-primary px-8 text-white shadow-soft hover:bg-rose-gold-600">
                        {tool.comingSoonCta}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {tool.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-[1.5rem] border border-cream-200 bg-white p-6 shadow-soft">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-gold-100">
                        <Sparkles className="h-5 w-5 text-rose-gold-700" />
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">{highlight}</p>
                    </div>
                  ))}
                  <div className="rounded-[1.5rem] border border-dashed border-rose-gold-300 bg-rose-gold-50/60 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-gold-700">
                      {locale === 'ru' ? 'Video tools' : 'Video tools'}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      {locale === 'ru'
                        ? 'Видео-ветка пойдёт отдельным long-running потоком, а не через сырой upload в обычный formData route.'
                        : 'The video branch will ship as a dedicated long-running pipeline, not as a fragile formData upload route.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mb-12 text-center"
          >
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
              {tool.featureTitle}
            </span>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.4rem)] font-medium tracking-tight text-foreground">
              {locale === 'ru' ? 'Три причины использовать этот инструмент' : 'Three reasons to use this tool'}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {tool.featureIntro}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {tool.highlights.map((highlight, index) => (
              <motion.div
                key={highlight}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
                className="rounded-2xl border border-cream-200 bg-white p-7 transition-all duration-300 hover:border-rose-gold-200 hover:shadow-card"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200">
                  <Sparkles className="h-6 w-6 text-rose-gold-700" />
                </div>
                <p className="text-base leading-relaxed text-foreground">{highlight}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mb-14 text-center"
          >
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
              {tool.howToOverline}
            </span>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.4rem)] font-medium tracking-tight text-foreground">
              {tool.howToTitle}
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {tool.steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
                className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-white p-7 transition-all duration-300 hover:border-rose-gold-200 hover:shadow-card"
              >
                <span className="absolute right-5 top-4 select-none font-serif text-7xl font-bold leading-none text-cream-200 transition-colors duration-300 group-hover:text-rose-gold-100">
                  {`0${index + 1}`}
                </span>
                <div className="relative z-10 pr-14">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200">
                    {index === 0 ? (
                      <Upload className="h-5 w-5 text-rose-gold-700" />
                    ) : index === 1 ? (
                      <Wand2 className="h-5 w-5 text-rose-gold-700" />
                    ) : (
                      <Download className="h-5 w-5 text-rose-gold-700" />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{step}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12 text-center"
          >
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
              {tool.relatedTitle}
            </span>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-tight text-foreground">
              {locale === 'ru' ? 'Что ещё посмотреть' : 'What to explore next'}
            </h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {relatedTools.map((relatedTool) => (
              <Link key={relatedTool.slug} href={`/tools/${relatedTool.slug}`} className="group block">
                <div className="h-full rounded-2xl border border-cream-200 bg-white p-6 transition-all duration-300 hover:border-rose-gold-200 hover:shadow-card">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="font-serif text-lg font-medium text-foreground">{relatedTool.title}</span>
                    <ArrowRight className="h-4 w-4 text-rose-gold-400 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{relatedTool.description}</p>
                  {relatedTool.status === 'soon' && (
                    <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
                      {locale === 'ru' ? 'Скоро' : 'Soon'}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-12 text-center"
          >
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
              FAQ
            </span>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-tight text-foreground">
              {tool.faqTitle}
            </h2>
          </motion.div>

          <div className="space-y-3">
            {tool.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-cream-200 bg-white px-6 py-5 text-left transition-all duration-200 hover:border-rose-gold-200 hover:shadow-soft"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium leading-snug text-foreground">{faq.q}</span>
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cream-100">
                      {isOpen ? (
                        <Minus className="h-3.5 w-3.5 text-rose-gold-600" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-rose-gold-600" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="-mt-2 rounded-b-2xl border border-t-0 border-cream-200 bg-white px-6 pb-5 pt-3 text-sm leading-relaxed text-muted-foreground">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
