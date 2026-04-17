'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Download,
  Loader2,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { EASE } from '@/lib/motion'
import {
  clearUpscaleSourceImage,
  readUpscaleSourceImage,
} from '@/lib/tools/upscale-transfer'

type ProcessStatus = 'idle' | 'processing' | 'done' | 'error'
type ScaleMode = '2x' | '4x'

interface ImageDimensions {
  width: number
  height: number
}

interface UpscaleApiError {
  error?: string
  code?: string
}

type ZoomTarget = 'before' | 'after' | null

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

interface UpscaleHeroProps {
  initialImageUrl?: string | null
}

export function UpscaleHero({ initialImageUrl = null }: UpscaleHeroProps) {
  const t = useTranslations('upscalePage')

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [inputDimensions, setInputDimensions] = useState<ImageDimensions | null>(null)
  const [outputDimensions, setOutputDimensions] = useState<ImageDimensions | null>(null)
  const [scaleMode, setScaleMode] = useState<ScaleMode>('4x')
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [zoomTarget, setZoomTarget] = useState<ZoomTarget>(null)

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const requestAbortRef = useRef<AbortController | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const resultUrlRef = useRef<string | null>(null)
  const prefillStartedRef = useRef(false)

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const revokeObjectUrl = useCallback((url: string | null) => {
    if (url) URL.revokeObjectURL(url)
  }, [])

  const startProgressSimulation = useCallback(() => {
    clearProgressTimer()
    setProgress(8)
    progressTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current
        return Math.min(92, current + Math.max(3, Math.round((100 - current) / 6)))
      })
    }, 550)
  }, [clearProgressTimer])

  const getFriendlyErrorMessage = useCallback((payload: UpscaleApiError | null) => {
    switch (payload?.code) {
      case 'rate_limited':
        return t('errorRateLimited')
      case 'file_too_large':
        return t('errorFileTooLarge')
      case 'invalid_image':
      case 'unsupported_format':
        return t('errorUnsupported')
      case 'output_limit_mp':
        return t('errorLimitMp')
      case 'output_limit_edge':
        return t('errorLimitEdge')
      case 'queue_busy':
        return t('errorQueueBusy')
      case 'provider_not_configured':
        return t('errorProviderConfig')
      case 'provider_auth':
        return t('errorProviderAuth')
      case 'provider_billing':
        return t('errorProviderBilling')
      case 'provider_invalid_image':
        return t('errorUnsupported')
      case 'provider_rate_limit':
        return t('errorProviderRateLimit')
      case 'provider_retry_later':
      case 'provider_unavailable':
        return t('errorProviderUnavailable')
      case 'provider_output_too_large':
        return t('errorLimitMp')
      default:
        return payload?.error || t('errorGeneric')
    }
  }, [t])

  const resetResult = useCallback(() => {
    revokeObjectUrl(resultUrlRef.current)
    resultUrlRef.current = null
    setResultUrl(null)
    setOutputDimensions(null)
  }, [revokeObjectUrl])

  const runUpscale = useCallback(async (file: File, nextScale: ScaleMode) => {
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
      formData.append('image', file)
      formData.append('scale', nextScale)

      const response = await fetch('/api/tools/upscale', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as UpscaleApiError | null
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
      setErrorMsg(error instanceof Error ? error.message : t('errorGeneric'))
    } finally {
      clearProgressTimer()
      if (!controller.signal.aborted) {
        requestAbortRef.current = null
      }
    }
  }, [clearProgressTimer, getFriendlyErrorMessage, resetResult, startProgressSimulation, t])

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

    await runUpscale(file, nextScale)
  }, [clearProgressTimer, previewUrl, resetResult, revokeObjectUrl, runUpscale, scaleMode])

  const handleSampleClick = useCallback(async (src: string) => {
    const response = await fetch(src)
    const blob = await response.blob()
    const file = new File([blob], 'sample.jpeg', { type: blob.type || 'image/jpeg' })
    await handleUpload(file)
  }, [handleUpload])

  const handleScaleChange = useCallback(async (nextScale: ScaleMode) => {
    setScaleMode(nextScale)
    if (!uploadedFile) return
    await runUpscale(uploadedFile, nextScale)
  }, [runUpscale, uploadedFile])

  const handleDownload = useCallback(() => {
    if (!resultUrl) return
    const anchor = document.createElement('a')
    anchor.href = resultUrl
    anchor.download = `enhanced-${scaleMode}.png`
    anchor.click()
  }, [resultUrl, scaleMode])

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
  }, [clearProgressTimer, previewUrl, resultUrl, revokeObjectUrl])

  const onDrop = useCallback((event: React.DragEvent) => {
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

  useEffect(() => {
    if (prefillStartedRef.current) return

    const queryImageUrl = typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('image')
    const sessionImageUrl = readUpscaleSourceImage()
    const sourceImageUrl = initialImageUrl || queryImageUrl || sessionImageUrl

    if (!sourceImageUrl) return

    prefillStartedRef.current = true

    const prefillFromUrl = async () => {
      try {
        const response = await fetch(sourceImageUrl)
        if (!response.ok) throw new Error('Failed to load source image.')

        const blob = await response.blob()
        const contentType = blob.type || 'image/jpeg'
        const extension = contentType.split('/')[1] || 'jpg'
        const file = new File([blob], `source-for-enhance.${extension}`, { type: contentType })
        clearUpscaleSourceImage()
        await handleUpload(file)
      } catch {
        clearUpscaleSourceImage()
        setProcessStatus('error')
        setErrorMsg(t('errorSharedImage'))
      }
    }

    void prefillFromUrl()
  }, [handleUpload, initialImageUrl, t])

  const isProcessing = processStatus === 'processing'
  const hasResult = Boolean(resultUrl)
  const zoomImageUrl = zoomTarget === 'before' ? previewUrl : resultUrl
  const zoomTitle = zoomTarget === 'before' ? t('beforeZoomTitle') : t('afterZoomTitle')
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
              {zoomDimensions ? `${formatResolution(zoomDimensions)} · ${t('zoomHint')}` : t('zoomHint')}
            </DialogDescription>
          </div>
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-cream-200 bg-cream-50 p-3">
            {zoomImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={zoomImageUrl}
                alt={zoomTitle}
                className="max-h-[75vh] w-full rounded-xl object-contain"
              />
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
              {t('eyebrow')}
            </span>
            <h1 className="mb-4 font-serif text-[clamp(2.2rem,5vw,3.7rem)] font-medium leading-tight tracking-tight text-foreground">
              {t('heroTitle')}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t('heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <div className="rounded-full border border-cream-300 bg-white/85 px-4 py-2 text-sm text-foreground shadow-soft">
                {t('badge1')}
              </div>
              <div className="rounded-full border border-cream-300 bg-white/85 px-4 py-2 text-sm text-foreground shadow-soft">
                {t('badge2')}
              </div>
              <div className="rounded-full border border-cream-300 bg-white/85 px-4 py-2 text-sm text-foreground shadow-soft">
                {t('badge3')}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="rounded-[2rem] border border-cream-300/80 bg-white/90 p-4 shadow-card backdrop-blur sm:p-6"
          >
            {!uploadedFile ? (
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
                  onClick={() => document.getElementById('upscale-upload')?.click()}
                >
                <input
                  id="upscale-upload"
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
                  {t('uploadTitle')}
                </h2>
                <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t('uploadBody')}
                </p>
                <Button
                  size="lg"
                  className="pointer-events-none h-12 rounded-xl bg-primary px-8 text-white shadow-soft hover:bg-rose-gold-600 hover:shadow-glow"
                >
                  {t('uploadBtn')}
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">{t('dropHint')}</p>
              </div>

                <div className="rounded-[1.5rem] border border-cream-200 bg-gradient-to-br from-[#FFFDFC] via-white to-rose-gold-50/40 p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-gold-100">
                    <Wand2 className="h-5 w-5 text-rose-gold-700" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-medium text-foreground">{t('panelTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('panelSubtitle')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[t('panelPoint1'), t('panelPoint2'), t('panelPoint3')].map((point) => (
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
                        <p className="font-medium text-amber-950">{t('limitBoxTitle')}</p>
                        <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                          {t('limitBoxBody')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="mb-4 text-sm text-muted-foreground">{t('noImage')}</p>
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
                          {t('before')}
                        </span>
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setZoomTarget('before')}
                            className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            {t('zoomAction')}
                          </button>
                        )}
                      </div>
                      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-cream-50 p-4">
                        {previewUrl && (
                          <button
                            type="button"
                            onClick={() => setZoomTarget('before')}
                            className="group relative block w-full"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previewUrl}
                              alt={t('before')}
                              className="max-h-[320px] max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative p-6">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-full bg-rose-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-gold-700">
                          {t('after')}
                        </span>
                        {hasResult && resultUrl && (
                          <button
                            type="button"
                            onClick={() => setZoomTarget('after')}
                            className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            {t('zoomAction')}
                          </button>
                        )}
                      </div>
                      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-gradient-to-br from-cream-50 via-white to-rose-gold-50/40 p-4">
                        {isProcessing && (
                          <div className="flex max-w-xs flex-col items-center gap-4 text-center">
                            <Loader2 className="h-10 w-10 animate-spin text-rose-gold-500" />
                            <div>
                              <p className="font-medium text-foreground">
                                {t('processing')} {progress > 0 ? `${progress}%` : ''}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{t('processingHint')}</p>
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
                          <button
                            type="button"
                            onClick={() => setZoomTarget('after')}
                            className="group relative block w-full"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resultUrl}
                              alt={t('after')}
                              className="max-h-[320px] max-w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                            />
                          </button>
                        )}

                        {!hasResult && !isProcessing && (
                          <div className="text-center text-sm text-muted-foreground">
                            {t('resultPlaceholder')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-cream-200 bg-gradient-to-br from-[#FFFDFC] to-cream-50 p-6 shadow-soft">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-gold-100">
                      <Maximize2 className="h-5 w-5 text-rose-gold-700" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-medium text-foreground">{t('controlsTitle')}</h3>
                      <p className="text-sm text-muted-foreground">{t('controlsSubtitle')}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {t('scaleLabel')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['2x', '4x'] as const).map((option) => {
                        const active = scaleMode === option
                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={isProcessing}
                            onClick={() => void handleScaleChange(option)}
                            className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                              active
                                ? 'border-rose-gold-300 bg-rose-gold-50 text-foreground shadow-soft'
                                : 'border-cream-200 bg-white text-muted-foreground hover:border-rose-gold-200'
                            }`}
                          >
                            <div className="font-serif text-lg font-medium">{option}</div>
                            <div className="text-xs">{option === '2x' ? t('scale2Desc') : t('scale4Desc')}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-cream-200 bg-white/85 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t('originalSize')}</span>
                      <span className="font-medium text-foreground">{formatResolution(inputDimensions)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t('enhancedSize')}</span>
                      <span className="font-medium text-foreground">{formatResolution(outputDimensions)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t('estimatedMp')}</span>
                      <span className="font-medium text-foreground">{estimateOutputMp(inputDimensions, scaleMode)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{t('delivery')}</span>
                      <span className="font-medium text-foreground">{t('deliveryValue')}</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <p className="font-medium text-red-800">{t('errorTitle')}</p>
                      <p className="mt-1 leading-relaxed">{errorMsg}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3">
                    <Button
                      size="lg"
                      onClick={handleDownload}
                      disabled={!hasResult || isProcessing}
                      className="h-12 rounded-xl bg-primary text-white shadow-soft hover:bg-rose-gold-600 hover:shadow-glow"
                    >
                      <Download className="h-4 w-4" />
                      {t('downloadBtn')}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => uploadedFile && void runUpscale(uploadedFile, scaleMode)}
                      disabled={!uploadedFile || isProcessing}
                      className="h-12 rounded-xl border-cream-300 bg-white"
                    >
                      <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                      {t('rerunBtn')}
                    </Button>
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={handleReset}
                      className="h-12 rounded-xl"
                    >
                      {t('tryAnother')}
                    </Button>
                  </div>
                </div>

                  <div className="rounded-[1.5rem] border border-cream-200 bg-white p-6 shadow-soft">
                    <h3 className="mb-4 font-serif text-xl font-medium text-foreground">{t('tipsTitle')}</h3>
                    <div className="space-y-3">
                      {[t('tip1'), t('tip2'), t('tip3')].map((tip) => (
                        <div key={tip} className="flex items-start gap-3">
                          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-gold-400" />
                          <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </>
  )
}
