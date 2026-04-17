'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Upload, Download, Loader2, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'
import { clientRemoveBg } from '@/lib/tools/client-remove-bg'

type ProcessStatus = 'idle' | 'processing' | 'done' | 'error'

const COLOR_PRESETS = [
  { value: '#ffffff', label: 'white' },
  { value: '#f5f5f5', label: 'light gray' },
  { value: '#000000', label: 'black' },
  { value: '#C4834F', label: 'rose gold' },
  { value: '#dbeafe', label: 'light blue' },
  { value: '#dcfce7', label: 'light green' },
  { value: '#fce7f3', label: 'pink' },
  { value: '#e8d5c4', label: 'beige' },
]

const SAMPLE_IMAGES = [
  '/examples/hf_20260309_090944_181c07c5-1859-48f5-adcb-adad853a4359.jpeg',
  '/examples/hf_20260309_100705_5ae3050b-b4c2-41f8-8321-fe15ee688dd2.jpeg',
  '/examples/hf_20260309_101146_d00781c1-567e-44ef-b3e0-3375aea94882.jpeg',
  '/examples/hf_20260309_102108_ba7dc28c-782e-425b-a9d5-e76c8d0b9120.jpeg',
]

export function WhiteBgHero() {
  const t = useTranslations('whiteBgPage')

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#ffffff')

  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle')
  const [, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const runningRef = useRef(false)
  const resultBlobRef = useRef<Blob | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Composite result on bgColor or resultBlob change
  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current
    const blob = resultBlobRef.current
    if (!canvas || !blob) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      // Fill background color
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Draw transparent product on top
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [bgColor])

  useEffect(() => {
    if (processStatus === 'done') renderComposite()
  }, [bgColor, processStatus, renderComposite])

  const processImage = useCallback(async (file: File) => {
    if (runningRef.current) return
    runningRef.current = true
    setProcessStatus('processing')
    setProgress(0)
    setErrorMsg('')
    resultBlobRef.current = null

    try {
      const resultBlob = await clientRemoveBg(file)
      resultBlobRef.current = resultBlob
      setResultBlobUrl(URL.createObjectURL(resultBlob))
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
    setResultBlobUrl(null)
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
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'white-background.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    }, 'image/png')
  }, [])

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setResultBlobUrl(null)
    setProcessStatus('idle')
    setProgress(0)
    setErrorMsg('')
    resultBlobRef.current = null
  }, [previewUrl, resultBlobUrl])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleUpload(f)
  }, [handleUpload])

  const isProcessing = processStatus === 'processing'

  return (
    <section className="relative pt-28 pb-16 px-6 overflow-hidden">
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
            /* Upload zone */
            <div className="max-w-2xl mx-auto">
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-all p-12 text-center cursor-pointer
                  ${isDragging
                    ? 'border-rose-gold-400 bg-rose-gold-50/60'
                    : 'border-cream-300 hover:border-rose-gold-300 hover:bg-cream-50 bg-white'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('white-bg-upload')?.click()}
              >
                <input
                  id="white-bg-upload"
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
            /* Result area */
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
                <div className="grid md:grid-cols-[1fr_280px]">
                  {/* Canvas / preview */}
                  <div className="p-6 flex items-center justify-center min-h-[400px] relative">
                    {isProcessing && (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-rose-gold-500 animate-spin" />
                        <p className="text-sm font-medium text-foreground">
                          {t('processing')}
                        </p>
                      </div>
                    )}
                    {processStatus === 'done' && (
                      <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-[420px] rounded-xl shadow-soft"
                        style={{ maxWidth: '100%' }}
                      />
                    )}
                    {processStatus === 'error' && (
                      <div className="text-center">
                        <p className="text-sm text-red-600 mb-2">{t('errorGeneric')}</p>
                        <p className="text-xs text-muted-foreground">{errorMsg}</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar controls */}
                  <div className="p-5 border-l border-cream-200 bg-cream-50 space-y-5">
                    {/* Original preview */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                        {t('original')}
                      </p>
                      {previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt="Original"
                          className="w-full rounded-xl border border-cream-200 object-contain max-h-32"
                        />
                      )}
                    </div>

                    {/* Color picker */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
                        {t('bgColorLabel')}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => setBgColor(preset.value)}
                            className={`w-8 h-8 rounded-lg border-2 transition-all relative ${
                              bgColor === preset.value
                                ? 'border-rose-gold-500 scale-110'
                                : 'border-cream-300 hover:border-rose-gold-300'
                            }`}
                            style={{ background: preset.value }}
                            title={preset.label}
                          >
                            {bgColor === preset.value && (
                              <Check className={`w-3.5 h-3.5 absolute inset-0 m-auto ${
                                preset.value === '#000000' ? 'text-white' : 'text-rose-gold-600'
                              }`} />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-cream-200"
                        />
                        <span className="text-xs text-muted-foreground font-mono">{bgColor}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        onClick={handleDownload}
                        disabled={processStatus !== 'done'}
                        className="w-full bg-primary hover:bg-rose-gold-600 text-white gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t('downloadPng')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="w-full text-muted-foreground hover:text-foreground gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {t('tryAnother')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
