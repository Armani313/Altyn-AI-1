'use client'

import { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Upload, Download, Loader2, Scissors, RefreshCw, CheckCircle2, WifiOff, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

const IMGLY_PUBLIC_PATH = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/'

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'
type ProcessStatus = 'idle' | 'processing' | 'done' | 'error'

const SAMPLE_IMAGES = [
  '/examples/hf_20260309_090944_181c07c5-1859-48f5-adcb-adad853a4359.jpeg',
  '/examples/hf_20260309_100705_5ae3050b-b4c2-41f8-8321-fe15ee688dd2.jpeg',
  '/examples/hf_20260309_101146_d00781c1-567e-44ef-b3e0-3375aea94882.jpeg',
  '/examples/hf_20260309_102108_ba7dc28c-782e-425b-a9d5-e76c8d0b9120.jpeg',
]

export function BgRemoverHero() {
  const t = useTranslations('bgRemoverPage')

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const runningRef = useRef(false)
  const resultUrlRef = useRef<string | null>(null)

  const processImage = useCallback(async (file: File) => {
    if (runningRef.current) return
    runningRef.current = true
    setProcessStatus('processing')
    setProgress(0)
    setErrorMsg('')

    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
      setResultUrl(null)
    }

    try {
      setModelStatus('loading')
      const { removeBackground } = await import('@imgly/background-removal')

      const resultBlob = await removeBackground(file, {
        publicPath: IMGLY_PUBLIC_PATH,
        proxyToWorker: true,
        model: 'isnet',
        output: { format: 'image/png', quality: 1.0 },
        progress: (key: string, current: number, total: number) => {
          if (key.startsWith('fetch:') && total > 0) {
            setModelProgress(Math.round((current / total) * 100))
            if (current >= total) setModelStatus('ready')
          }
          if (total > 0) setProgress(Math.round((current / total) * 100))
        },
      })

      setModelStatus('ready')
      const url = URL.createObjectURL(resultBlob)
      resultUrlRef.current = url
      setResultUrl(url)
      setProcessStatus('done')
      setProgress(100)
    } catch (err) {
      setProcessStatus('error')
      setErrorMsg(String(err instanceof Error ? err.message : err))
    } finally {
      runningRef.current = false
    }
  }, [])

  const handleUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setUploadedFile(file)
    setPreviewUrl(url)
    setResultUrl(null)
    setProcessStatus('idle')
    processImage(file)
  }, [processImage])

  const handleSampleClick = useCallback(async (src: string) => {
    const res = await fetch(src)
    const blob = await res.blob()
    const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' })
    handleUpload(file)
  }, [handleUpload])

  const handleDownload = useCallback(() => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = 'background-removed.png'
    a.click()
  }, [resultUrl])

  const handleReset = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setProcessStatus('idle')
    setProgress(0)
    setErrorMsg('')
    resultUrlRef.current = null
  }, [previewUrl])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleUpload(f)
  }, [handleUpload])

  const isProcessing = processStatus === 'processing'

  return (
    <section className="relative pt-28 pb-16 px-6 overflow-hidden">
      {/* Background decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-rose-gold-100/50 via-rose-gold-50/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-12"
        >
          <h1 className="font-serif text-[clamp(2rem,5vw,3.25rem)] font-medium text-foreground leading-tight tracking-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </motion.div>

        {/* Tool area */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
        >
          {!uploadedFile ? (
            /* ── Upload zone ── */
            <div className="max-w-2xl mx-auto">
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-all p-12 text-center cursor-pointer
                  ${isDragging
                    ? 'border-rose-gold-400 bg-rose-gold-50/60'
                    : 'border-cream-300 hover:border-rose-gold-300 hover:bg-cream-50 bg-white'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('bg-tool-upload')?.click()}
              >
                <input
                  id="bg-tool-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
                />
                <Upload className="w-10 h-10 text-rose-gold-400 mx-auto mb-4" />
                <Button
                  size="lg"
                  className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow h-12 px-8 mb-3 pointer-events-none"
                >
                  {t('uploadBtn')}
                </Button>
                <p className="text-sm text-muted-foreground">{t('dropHint')}</p>
              </div>

              {/* Sample images */}
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">{t('noImage')}</p>
                <div className="flex justify-center gap-3">
                  {SAMPLE_IMAGES.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => handleSampleClick(src)}
                      className="w-16 h-16 rounded-xl overflow-hidden border-2 border-cream-200 hover:border-rose-gold-300 transition-all hover:scale-105"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Result area ── */
            <div className="max-w-3xl mx-auto">
              {/* Before / After */}
              <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
                <div className="grid grid-cols-2 min-h-[400px]">
                  {/* Before */}
                  <div className="p-6 flex flex-col items-center justify-center border-r border-cream-200">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      {t('before')}
                    </span>
                    {previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="max-w-full max-h-[320px] rounded-xl object-contain"
                      />
                    )}
                  </div>

                  {/* After */}
                  <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-br from-cream-50 to-rose-gold-50/30 relative">
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-gold-600 mb-3">
                      {t('after')}
                    </span>
                    {isProcessing && (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-rose-gold-500 animate-spin" />
                        <p className="text-sm font-medium text-foreground">
                          {t('processing')} {progress > 0 ? `${progress}%` : ''}
                        </p>
                        {modelStatus === 'loading' && (
                          <div className="w-48">
                            <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500 rounded-full transition-all duration-300"
                                style={{ width: `${modelProgress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">
                              {t('loadingModel')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {resultUrl && !isProcessing && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resultUrl}
                        alt="Result"
                        className="max-w-full max-h-[320px] rounded-xl object-contain"
                        style={{ backgroundImage: 'repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%)', backgroundSize: '16px 16px' }}
                      />
                    )}
                    {processStatus === 'error' && (
                      <div className="text-center">
                        <p className="text-sm text-red-600 mb-2">{t('errorGeneric')}</p>
                        <p className="text-xs text-muted-foreground">{errorMsg}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-cream-50 border-t border-cream-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('tryAnother')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={processStatus !== 'done'}
                    className="bg-primary hover:bg-rose-gold-600 text-white gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadPng')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
