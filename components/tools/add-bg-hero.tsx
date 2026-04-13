'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Upload, Download, Loader2, RefreshCw, ImagePlus, LayoutGrid, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'
import { clientRemoveBg } from '@/lib/tools/client-remove-bg'

type ProcessStatus = 'idle' | 'processing' | 'done' | 'error'
type BgSource = 'preset' | 'custom'

const GRADIENT_BG_PRESETS = [
  { css: 'linear-gradient(135deg, #ffecd2, #fcb69f)', label: 'Dawn' },
  { css: 'linear-gradient(135deg, #e0e0e0, #bdbdbd)', label: 'Silver' },
  { css: 'linear-gradient(135deg, #f5e6d3, #d4b896)', label: 'Sand' },
  { css: 'linear-gradient(135deg, #2d2d2d, #1a1a1a)', label: 'Dark' },
  { css: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', label: 'Sky' },
  { css: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)', label: 'Lavender' },
  { css: 'linear-gradient(135deg, #84fab0, #8fd3f4)', label: 'Mint' },
  { css: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', label: 'Rose' },
]

const SOLID_PRESETS = [
  { color: '#ffffff', label: 'White' },
  { color: '#f5f0eb', label: 'Cream' },
  { color: '#e8ddd3', label: 'Sand' },
  { color: '#d4c5b5', label: 'Latte' },
  { color: '#2d2d2d', label: 'Charcoal' },
  { color: '#1a1a2e', label: 'Navy' },
  { color: '#f0e6d3', label: 'Beige' },
  { color: '#e8e0d8', label: 'Pearl' },
]

const SAMPLE_IMAGES = [
  '/examples/hf_20260309_090944_181c07c5-1859-48f5-adcb-adad853a4359.jpeg',
  '/examples/hf_20260309_100705_5ae3050b-b4c2-41f8-8321-fe15ee688dd2.jpeg',
  '/examples/hf_20260309_101146_d00781c1-567e-44ef-b3e0-3375aea94882.jpeg',
  '/examples/hf_20260309_102108_ba7dc28c-782e-425b-a9d5-e76c8d0b9120.jpeg',
]

export function AddBgHero() {
  const t = useTranslations('addBgPage')

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [bgSource, setBgSource] = useState<BgSource>('preset')
  const [selectedColor, setSelectedColor] = useState('#ffffff')
  const [selectedGradient, setSelectedGradient] = useState<typeof GRADIENT_BG_PRESETS[0] | null>(null)
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null)
  const [customBgFile, setCustomBgFile] = useState<File | null>(null)

  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const runningRef = useRef(false)
  const foregroundBlobRef = useRef<Blob | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const renderComposite = useCallback(() => {
    const canvas = canvasRef.current
    const fgBlob = foregroundBlobRef.current
    if (!canvas || !fgBlob) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fgUrl = URL.createObjectURL(fgBlob)
    const fgImg = new Image()
    fgImg.onload = () => {
      canvas.width = fgImg.naturalWidth
      canvas.height = fgImg.naturalHeight

      if (bgSource === 'custom' && customBgUrl) {
        // Draw custom background image
        const bgImg = new Image()
        bgImg.crossOrigin = 'anonymous'
        bgImg.onload = () => {
          const scale = Math.max(canvas.width / bgImg.naturalWidth, canvas.height / bgImg.naturalHeight)
          const w = bgImg.naturalWidth * scale
          const h = bgImg.naturalHeight * scale
          const x = (canvas.width - w) / 2
          const y = (canvas.height - h) / 2
          ctx.drawImage(bgImg, x, y, w, h)
          ctx.drawImage(fgImg, 0, 0)
          URL.revokeObjectURL(fgUrl)
        }
        bgImg.onerror = () => {
          ctx.fillStyle = selectedColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(fgImg, 0, 0)
          URL.revokeObjectURL(fgUrl)
        }
        bgImg.src = customBgUrl
      } else if (selectedGradient && bgSource === 'preset') {
        // Parse CSS gradient and draw on canvas
        const match = selectedGradient.css.match(/#[0-9a-fA-F]{6}/g)
        if (match && match.length >= 2) {
          const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
          g.addColorStop(0, match[0])
          g.addColorStop(1, match[1])
          ctx.fillStyle = g
        } else {
          ctx.fillStyle = selectedColor
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(fgImg, 0, 0)
        URL.revokeObjectURL(fgUrl)
      } else {
        // Solid color background
        ctx.fillStyle = selectedColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(fgImg, 0, 0)
        URL.revokeObjectURL(fgUrl)
      }
    }
    fgImg.src = fgUrl
  }, [bgSource, selectedColor, selectedGradient, customBgUrl])

  useEffect(() => {
    if (processStatus === 'done') renderComposite()
  }, [bgSource, selectedColor, selectedGradient, customBgUrl, processStatus, renderComposite])

  const processImage = useCallback(async (file: File) => {
    if (runningRef.current) return
    runningRef.current = true
    setProcessStatus('processing')
    setProgress(0)
    setErrorMsg('')
    foregroundBlobRef.current = null

    try {
      const resultBlob = await clientRemoveBg(file)
      foregroundBlobRef.current = resultBlob
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
    setProcessStatus('idle')
    processImage(file)
  }, [processImage])

  const handleSampleClick = useCallback(async (src: string) => {
    const res = await fetch(src)
    const blob = await res.blob()
    const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' })
    handleUpload(file)
  }, [handleUpload])

  const handleCustomBgUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (customBgUrl) URL.revokeObjectURL(customBgUrl)
    const url = URL.createObjectURL(file)
    setCustomBgFile(file)
    setCustomBgUrl(url)
    setBgSource('custom')
  }, [customBgUrl])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'new-background.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    }, 'image/png')
  }, [])

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (customBgUrl && customBgUrl.startsWith('blob:')) URL.revokeObjectURL(customBgUrl)
    setUploadedFile(null)
    setPreviewUrl(null)
    setCustomBgUrl(null)
    setCustomBgFile(null)
    setProcessStatus('idle')
    setProgress(0)
    setErrorMsg('')
    foregroundBlobRef.current = null
  }, [previewUrl, customBgUrl])

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
                onClick={() => document.getElementById('add-bg-upload')?.click()}
              >
                <input
                  id="add-bg-upload"
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
                  {/* Canvas */}
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

                  {/* Sidebar */}
                  <div className="p-5 border-l border-cream-200 bg-cream-50 space-y-4 overflow-y-auto max-h-[520px]">
                    {/* Original */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                        {t('original')}
                      </p>
                      {previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="Original" className="w-full rounded-xl border border-cream-200 object-contain max-h-28" />
                      )}
                    </div>

                    {/* Solid colors */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                        {t('solidColors')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SOLID_PRESETS.map((c) => (
                          <button
                            key={c.color}
                            onClick={() => { setBgSource('preset'); setSelectedColor(c.color); setSelectedGradient(null) }}
                            className={`w-7 h-7 rounded-lg border-2 transition-all ${
                              bgSource === 'preset' && selectedColor === c.color && !selectedGradient
                                ? 'border-rose-gold-500 scale-110'
                                : 'border-cream-300 hover:border-rose-gold-300'
                            }`}
                            style={{ background: c.color }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Gradient backgrounds */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                        {t('imageBgs')}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {GRADIENT_BG_PRESETS.map((g) => (
                          <button
                            key={g.label}
                            onClick={() => { setBgSource('preset'); setSelectedGradient(g) }}
                            className={`aspect-square rounded-lg border-2 transition-all ${
                              bgSource === 'preset' && selectedGradient?.label === g.label
                                ? 'border-rose-gold-500 scale-110'
                                : 'border-cream-300 hover:border-rose-gold-300'
                            }`}
                            style={{ background: g.css }}
                            title={g.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Upload custom background */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                        {t('customBg')}
                      </p>
                      <button
                        onClick={() => document.getElementById('custom-bg-upload')?.click()}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-cream-300 hover:border-rose-gold-300 bg-white hover:bg-cream-50 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground"
                      >
                        <ImagePlus className="w-4 h-4" />
                        {t('uploadBgBtn')}
                      </button>
                      <input
                        id="custom-bg-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCustomBgUpload(f) }}
                      />
                      {customBgFile && bgSource === 'custom' && customBgUrl?.startsWith('blob:') && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">{customBgFile.name}</p>
                      )}
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

                    {/* Upsell CTA */}
                    {processStatus === 'done' && (
                      <div className="border-t border-cream-200 pt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                          {t('nextStep')}
                        </p>
                        <Link href="/cards">
                          <Button
                            variant="outline"
                            className="w-full border-rose-gold-200 text-rose-gold-700 hover:bg-rose-gold-50 gap-2 mb-2"
                          >
                            <LayoutGrid className="w-4 h-4" />
                            {t('createCard')}
                          </Button>
                        </Link>
                        <Link href="/editor">
                          <Button
                            variant="outline"
                            className="w-full border-rose-gold-200 text-rose-gold-700 hover:bg-rose-gold-50 gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            {t('generateAi')}
                          </Button>
                        </Link>
                      </div>
                    )}
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
