'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Upload, Download, Loader2, Scissors, RefreshCw, ImagePlus, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

type BgType        = 'transparent' | 'color' | 'gradient' | 'image'
type EditorStatus  = 'idle' | 'processing' | 'done' | 'error'
type ModelStatus   = 'loading' | 'ready' | 'error'
type GradientPreset = { label: string; from: string; to: string }

// ─── Constants ────────────────────────────────────────────────────────────────

/** Longest side of the output canvas in pixels */
const CANVAS_BASE = 720

const ASPECT_RATIOS = [
  { label: '1:1',  w: 1,  h: 1  },
  { label: '3:4',  w: 3,  h: 4  },
  { label: '2:3',  w: 2,  h: 3  },
  { label: '9:16', w: 9,  h: 16 },
  { label: '16:9', w: 16, h: 9  },
] as const

type RatioLabel = (typeof ASPECT_RATIOS)[number]['label']

function getCanvasDims(ratioW: number, ratioH: number): { cw: number; ch: number } {
  if (ratioW >= ratioH) return { cw: CANVAS_BASE, ch: Math.round(CANVAS_BASE * ratioH / ratioW) }
  return { cw: Math.round(CANVAS_BASE * ratioW / ratioH), ch: CANVAS_BASE }
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { label: 'Рассвет', from: '#ffecd2', to: '#fcb69f' },
  { label: 'Небо',    from: '#a1c4fd', to: '#c2e9fb' },
  { label: 'Лаванда', from: '#e0c3fc', to: '#8ec5fc' },
  { label: 'Ночь',    from: '#1a1a2e', to: '#16213e' },
  { label: 'Мята',    from: '#84fab0', to: '#8fd3f4' },
  { label: 'Золото',  from: '#f6d365', to: '#fda085' },
  { label: 'Роза',    from: '#fbc2eb', to: '#a6c1ee' },
  { label: 'Мрамор',  from: '#e8e8e8', to: '#f5f5f5' },
]

const SOLID_PRESETS = [
  '#ffffff', '#f5f5f5', '#1a1a1a', '#000000',
  '#C4834F', '#e8d5c4', '#dbeafe', '#dcfce7',
]

// ─── Component ────────────────────────────────────────────────────────────────

export function BgRemovalEditor() {
  const [uploadedFile,  setUploadedFile]  = useState<File | null>(null)
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null)
  const [resultEl,      setResultEl]      = useState<HTMLImageElement | null>(null)

  const [status,        setStatus]        = useState<EditorStatus>('idle')
  const [progress,      setProgress]      = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [errorMsg,      setErrorMsg]      = useState('')

  const [bgType,        setBgType]        = useState<BgType>('color')
  const [bgColor,       setBgColor]       = useState('#ffffff')
  const [bgGradient,    setBgGradient]    = useState<GradientPreset>(GRADIENT_PRESETS[0])
  const [bgImageFile,   setBgImageFile]   = useState<File | null>(null)
  const [bgImageEl,     setBgImageEl]     = useState<HTMLImageElement | null>(null)
  const [productScale,  setProductScale]  = useState(0.85)

  const [ratioLabel,    setRatioLabel]    = useState<RatioLabel>('1:1')

  const [modelStatus,   setModelStatus]   = useState<ModelStatus>('loading')
  const [modelProgress, setModelProgress] = useState(0)

  // ── Derived canvas dimensions ────────────────────────────────────────────
  const activeRatio = ASPECT_RATIOS.find((r) => r.label === ratioLabel) ?? ASPECT_RATIOS[0]
  const { cw: canvasW, ch: canvasH } = getCanvasDims(activeRatio.w, activeRatio.h)

  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const blobUrlRef      = useRef<string | null>(null)
  const bgUrlRef        = useRef<string | null>(null)
  const runningRef      = useRef(false)
  const modelWarmupDone = useRef(false)

  // cleanup
  useEffect(() => () => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    if (bgUrlRef.current)   URL.revokeObjectURL(bgUrlRef.current)
  }, [])

  // Eager model warm-up — triggers the 168 MB model download in the background
  // so it is cached in IndexedDB before the user clicks "Удалить фон".
  useEffect(() => {
    if (modelWarmupDone.current) return
    modelWarmupDone.current = true

    const warmup = async () => {
      try {
        const { removeBackground } = await import('@imgly/background-removal')
        // 1×1 transparent PNG — smallest possible valid image
        const canvas = document.createElement('canvas')
        canvas.width = 1; canvas.height = 1
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
        })
        await removeBackground(blob, {
          proxyToWorker: true,
          model: 'isnet',
          output: { format: 'image/png' },
          progress: (_key: string, current: number, total: number) => {
            if (total > 0) setModelProgress(Math.round((current / total) * 100))
          },
        })
        setModelStatus('ready')
      } catch {
        setModelStatus('error')
      }
    }

    warmup()
  }, [])

  // ── Canvas rendering ──────────────────────────────────────────────────────

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx    = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    // Sync canvas buffer size with current aspect ratio
    if (canvas.width !== canvasW || canvas.height !== canvasH) {
      canvas.width  = canvasW
      canvas.height = canvasH
    }

    ctx.clearRect(0, 0, canvasW, canvasH)

    // background
    if (bgType === 'color') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvasW, canvasH)
    } else if (bgType === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, canvasW, canvasH)
      g.addColorStop(0, bgGradient.from); g.addColorStop(1, bgGradient.to)
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvasW, canvasH)
    } else if (bgType === 'image' && bgImageEl) {
      ctx.drawImage(bgImageEl, 0, 0, canvasW, canvasH)
    } else {
      for (let y = 0; y < canvasH; y += 16)
        for (let x = 0; x < canvasW; x += 16) {
          ctx.fillStyle = ((x + y) / 16) % 2 === 0 ? '#e8e8e8' : '#ffffff'
          ctx.fillRect(x, y, 16, 16)
        }
    }

    // product
    const src = resultEl ?? (previewUrl ? (() => {
      const i = new Image(); i.src = previewUrl; return i
    })() : null)
    if (src) {
      const w = src.naturalWidth  || src.width  || 1
      const h = src.naturalHeight || src.height || 1
      const f = Math.min(canvasW / w, canvasH / h) * productScale
      ctx.drawImage(src, (canvasW - w * f) / 2, (canvasH - h * f) / 2, w * f, h * f)
    }
  }, [bgType, bgColor, bgGradient, bgImageEl, resultEl, previewUrl, productScale, canvasW, canvasH])

  useEffect(() => { renderCanvas() }, [renderCanvas])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleProductUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(file)
    blobUrlRef.current = url
    setUploadedFile(file); setPreviewUrl(url)
    setResultEl(null); setErrorMsg('')
    setStatus('idle'); setProgress(0)
  }, [])

  const handleBgImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current)
    const url = URL.createObjectURL(file)
    bgUrlRef.current = url
    const img = new Image()
    img.onload = () => setBgImageEl(img)
    img.src = url
    setBgImageFile(file); setBgType('image')
  }, [])

  const handleRemoveBg = useCallback(async () => {
    if (!uploadedFile || runningRef.current) return
    runningRef.current = true
    setStatus('processing'); setProgress(0); setErrorMsg(''); setResultEl(null)

    try {
      const { removeBackground } = await import('@imgly/background-removal')

      const resultBlob = await removeBackground(uploadedFile, {
        proxyToWorker: true,
        // 'isnet'        = fp32 full-precision — best quality mask
        // 'isnet_fp16'   = default — faster but weaker edges
        // 'isnet_quint8' = fastest, lowest quality
        model:  'isnet',
        output: { format: 'image/png', quality: 1.0 },
        progress: (key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 100))
          setProgressLabel(key)
        },
      })

      const url = URL.createObjectURL(resultBlob)
      const img = new Image()
      img.onload = () => {
        setResultEl(img)
        setStatus('done')
        setProgress(100)
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
      img.src = url
    } catch (err) {
      setStatus('error')
      setErrorMsg(String(err instanceof Error ? err.message : err))
    } finally {
      runningRef.current = false
    }
  }, [uploadedFile])

  const handleDownload = useCallback(() => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = 'result.png'; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5_000)
    }, 'image/png')
  }, [])

  const [isDragging, setIsDragging] = useState(false)
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleProductUpload(f)
  }, [handleProductUpload])

  // ── Render ────────────────────────────────────────────────────────────────

  const isProcessing  = status === 'processing'
  const isModelReady  = modelStatus === 'ready'
  const canProcess    = !!uploadedFile && !isProcessing && isModelReady
  const canDownload   = status === 'done'

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">

      {/* ── Left panel ── */}
      <div className="w-full lg:w-[300px] flex-shrink-0 space-y-3">

        {/* Upload */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
            ${isDragging ? 'border-rose-gold-400 bg-rose-gold-50/60'
                         : 'border-cream-300 hover:border-rose-gold-300 hover:bg-cream-50'}
            ${uploadedFile ? 'p-2' : 'p-8'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('product-upload')?.click()}
        >
          <input id="product-upload" type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProductUpload(f) }} />
          {uploadedFile ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl!} alt="Товар"
                className="w-14 h-14 object-contain rounded-xl border border-cream-200 bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{uploadedFile.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Нажмите для замены</p>
              </div>
              <RefreshCw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ) : (
            <div className="text-center pointer-events-none">
              <Upload className="w-8 h-8 text-rose-gold-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Загрузите фото товара</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP</p>
            </div>
          )}
        </div>

        {/* Model readiness indicator */}
        {modelStatus === 'loading' && (
          <div className="bg-cream-100 rounded-xl p-3 border border-cream-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-rose-gold-500 animate-spin" />
                <span className="text-xs font-medium text-foreground">Загрузка модели ИИ…</span>
              </div>
              <span className="text-xs text-muted-foreground">{modelProgress}%</span>
            </div>
            <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500 rounded-full transition-all duration-300"
                style={{ width: `${modelProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Загружается один раз — кешируется в браузере
            </p>
          </div>
        )}

        {modelStatus === 'ready' && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="text-xs font-medium text-green-700">Модель готова к работе</span>
          </div>
        )}

        {modelStatus === 'error' && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <WifiOff className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-700">Не удалось загрузить модель — проверьте соединение</span>
          </div>
        )}

        {/* Button */}
        <Button onClick={handleRemoveBg} disabled={!canProcess}
          className="w-full gradient-rose-gold text-white rounded-xl h-10 font-medium gap-2">
          {isProcessing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Обработка…</>
            : <><Scissors className="w-4 h-4" /> Удалить фон</>}
        </Button>

        {/* Progress */}
        {isProcessing && (
          <div className="bg-cream-100 rounded-xl p-3 border border-cream-200">
            <p className="text-xs font-medium text-foreground mb-1.5">
              Удаление фона… <span className="text-muted-foreground font-normal">{progress}%</span>
            </p>
            <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500
                              rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }} />
            </div>
            {progressLabel && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate">{progressLabel}</p>
            )}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 break-all">{errorMsg}</p>
          </div>
        )}

        {/* Background picker */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">Фон</p>
          <div className="grid grid-cols-4 gap-1.5">
            {(['transparent','color','gradient','image'] as BgType[]).map((t) => (
              <button key={t} onClick={() => setBgType(t)}
                className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  bgType === t
                    ? 'bg-rose-gold-100 text-rose-gold-700 border border-rose-gold-200'
                    : 'bg-cream-100 text-muted-foreground hover:bg-cream-200'
                }`}>
                {t === 'transparent' ? 'Прозр.' : t === 'color' ? 'Цвет'
                  : t === 'gradient' ? 'Градиент' : 'Фото'}
              </button>
            ))}
          </div>

          {bgType === 'color' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {SOLID_PRESETS.map((c) => (
                  <button key={c} onClick={() => setBgColor(c)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      bgColor === c ? 'border-rose-gold-500 scale-110' : 'border-transparent hover:border-cream-400'
                    }`} style={{ background: c }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-cream-200" />
                <span className="text-xs text-muted-foreground">{bgColor}</span>
              </div>
            </div>
          )}

          {bgType === 'gradient' && (
            <div className="flex flex-wrap gap-1.5">
              {GRADIENT_PRESETS.map((g) => (
                <button key={g.label} onClick={() => setBgGradient(g)} title={g.label}
                  className={`w-7 h-7 rounded-lg border-2 transition-all ${
                    bgGradient.label === g.label
                      ? 'border-rose-gold-500 scale-110' : 'border-transparent hover:border-cream-400'
                  }`} style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }} />
              ))}
            </div>
          )}

          {bgType === 'image' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                bgImageFile ? 'border-rose-gold-200 bg-rose-gold-50' : 'border-cream-300 bg-cream-100'
              }`}>
                <ImagePlus className="w-3.5 h-3.5 text-rose-gold-500 flex-shrink-0" />
                <span className="truncate text-muted-foreground">
                  {bgImageFile ? bgImageFile.name : 'Выбрать фото фона…'}
                </span>
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgImageUpload(f) }} />
            </label>
          )}
        </div>

        {/* Canvas settings: aspect ratio + product scale */}
        <div className="bg-white rounded-2xl border border-cream-200 p-4 space-y-4">

          {/* Aspect ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Соотношение сторон
              </p>
              <span className="text-[10px] text-muted-foreground font-mono">
                {canvasW}×{canvasH}
              </span>
            </div>
            <div className="flex gap-1.5">
              {ASPECT_RATIOS.map(({ label, w, h }) => {
                const isActive = ratioLabel === label
                // Mini preview ratio for the visual indicator
                const previewW = w >= h ? 18 : Math.round(18 * w / h)
                const previewH = h >= w ? 18 : Math.round(18 * h / w)
                return (
                  <button
                    key={label}
                    onClick={() => setRatioLabel(label)}
                    className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      isActive
                        ? 'bg-rose-gold-100 text-rose-gold-700 border border-rose-gold-200'
                        : 'bg-cream-100 text-muted-foreground hover:bg-cream-200'
                    }`}
                  >
                    {/* Mini ratio box */}
                    <span
                      className={`rounded-[2px] border ${isActive ? 'border-rose-gold-400' : 'border-muted-foreground/40'}`}
                      style={{ width: previewW, height: previewH, display: 'block' }}
                    />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <hr className="border-cream-200" />

          {/* Product scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                Размер товара
              </p>
              <span className="text-xs font-medium text-foreground">{Math.round(productScale * 100)}%</span>
            </div>
            <input type="range" min={0.2} max={1.5} step={0.01} value={productScale}
              onChange={(e) => setProductScale(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full accent-rose-gold-500 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>20%</span><span>150%</span>
            </div>
          </div>
        </div>

        {/* Download */}
        <Button onClick={handleDownload} disabled={!canDownload} variant="outline"
          className="w-full rounded-xl h-10 gap-2 border-rose-gold-200 text-rose-gold-700
                     hover:bg-rose-gold-50 disabled:opacity-40">
          <Download className="w-4 h-4" /> Скачать PNG
        </Button>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {isProcessing && (
            <div className="absolute inset-0 z-10 rounded-2xl bg-white/70 backdrop-blur-sm
                            flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-rose-gold-500 animate-spin" />
              <p className="text-sm font-medium text-foreground">
                Удаление фона… {progress > 0 ? `${progress}%` : ''}
              </p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="rounded-2xl border border-cream-200 shadow-card"
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)' }}
          />
          {!uploadedFile && (
            <div className="absolute inset-0 flex flex-col items-center justify-center
                            text-center p-6 pointer-events-none">
              <Scissors className="w-10 h-10 text-rose-gold-300 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Загрузите фото товара</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Фон удаляется прямо в браузере</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
