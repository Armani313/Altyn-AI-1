'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Camera, X, ImagePlus, Sparkles,
  Lock, ArrowRight, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_MB, MAX_IMAGE_BYTES } from '@/lib/constants'
import { EASE } from '@/lib/motion'

// ── Constants ──────────────────────────────────────────────────────────────────

const DEMO_USED_KEY = 'nurai_demo_used'

const CATEGORIES = [
  { id: 'rings',     label: 'Кольца' },
  { id: 'necklaces', label: 'Ожерелья' },
  { id: 'earrings',  label: 'Серьги' },
  { id: 'bracelets', label: 'Браслеты' },
] as const

type Category = typeof CATEGORIES[number]['id']

// ── Main section ───────────────────────────────────────────────────────────────

export function DemoSection() {
  // localStorage flag: prevents showing the form if demo was already used
  const [demoUsed, setDemoUsed]     = useState(false)
  const [hydrated, setHydrated]     = useState(false)

  // File + upload state
  const [file, setFile]             = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef                    = useRef<HTMLInputElement>(null)

  // Generation state
  const [category, setCategory]       = useState<Category>('rings')
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultUrl, setResultUrl]     = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  // Hydrate localStorage state on client
  useEffect(() => {
    setDemoUsed(!!localStorage.getItem(DEMO_USED_KEY))
    setHydrated(true)
  }, [])

  // ── File handling ────────────────────────────────────────────────────────────

  const processFile = useCallback((f: File) => {
    setError(null)

    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type)) {
      setError('Поддерживаются форматы: JPG, PNG, WEBP, HEIC')
      return
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setError(`Максимальный размер файла — ${MAX_IMAGE_MB} МБ`)
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setResultUrl(null)
  }, [previewUrl])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [processFile])

  const handleRemove = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setError(null)
  }, [previewUrl])

  // ── Generation ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!file || isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('template_category', category)

      const res  = await fetch('/api/generate/demo', { method: 'POST', body: fd })
      const data = await res.json() as { outputUrl?: string; error?: string }

      if (!res.ok) {
        if (res.status === 429) {
          localStorage.setItem(DEMO_USED_KEY, '1')
          setDemoUsed(true)
        }
        setError(data.error ?? 'Ошибка генерации. Попробуйте снова.')
        return
      }

      setResultUrl(data.outputUrl ?? null)
      localStorage.setItem(DEMO_USED_KEY, '1')
      setDemoUsed(true)
    } catch {
      setError('Ошибка соединения. Проверьте интернет и попробуйте снова.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Prevent layout flash during SSR ─────────────────────────────────────────
  if (!hydrated) return null

  return (
    <section className="py-20 bg-cream-50 border-y border-cream-200">
      <div className="max-w-6xl mx-auto px-6">

        {/* ── Section header ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 bg-rose-gold-100 text-rose-gold-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Попробуйте бесплатно
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground leading-tight mb-3">
            Одна генерация — без регистрации
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            Загрузите фото любого украшения и убедитесь в качестве сами.
          </p>
        </motion.div>

        {/* ── Widget body ────────────────────────────────────── */}
        {demoUsed && !resultUrl ? (
          <AlreadyUsedCard />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {/* ── Left: controls ─────────────────────────────── */}
            <div className="flex flex-col gap-4">

              {/* Upload zone */}
              {previewUrl ? (
                <div className="relative group rounded-2xl overflow-hidden border border-cream-200 shadow-card aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Загруженное фото украшения"
                    className="w-full h-full object-cover"
                  />
                  {!demoUsed && (
                    <button
                      onClick={handleRemove}
                      className="absolute top-3 right-3 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-soft">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Фото загружено
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`
                    relative flex flex-col items-center justify-center
                    aspect-square rounded-2xl border-2 border-dashed cursor-pointer
                    transition-all duration-300 select-none
                    ${isDragging
                      ? 'border-primary bg-rose-gold-50 scale-[1.01] shadow-glow'
                      : 'border-cream-300 bg-white hover:border-rose-gold-300 hover:bg-rose-gold-50/40'
                    }
                  `}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.03] rounded-2xl"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #C4834F 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isDragging ? 'bg-rose-gold-200' : 'bg-rose-gold-100'}`}>
                      {isDragging
                        ? <ImagePlus className="w-7 h-7 text-rose-gold-600" />
                        : <Camera className="w-7 h-7 text-rose-gold-500" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">
                        {isDragging ? 'Отпустите файл здесь' : 'Перетащите фото украшения'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        или{' '}
                        <span className="text-primary font-medium underline underline-offset-2">
                          выберите файл
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground bg-cream-100 rounded-lg px-3 py-1.5">
                      JPG, PNG, WEBP, HEIC · до {MAX_IMAGE_MB} МБ
                    </p>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) processFile(f)
                    }}
                  />
                </div>
              )}

              {/* Category tabs */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  Тип украшения
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => !demoUsed && setCategory(cat.id)}
                      disabled={demoUsed}
                      className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        category === cat.id
                          ? 'bg-primary text-white shadow-soft'
                          : 'bg-cream-100 text-muted-foreground hover:text-foreground hover:bg-cream-200'
                      } disabled:opacity-60 disabled:cursor-default`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Generate button (or locked state after demo) */}
              {demoUsed && resultUrl ? (
                <div className="space-y-2">
                  <Button
                    disabled
                    className="w-full h-12 bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    1 из 1 генерация использована
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    <Link href="/register" className="text-primary hover:underline font-medium">
                      Зарегистрируйтесь
                    </Link>{' '}
                    чтобы получить ещё 3 бесплатные генерации
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleGenerate}
                    disabled={!file || isGenerating}
                    className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                      file && !isGenerating
                        ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Генерируем...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5" />
                        Сгенерировать бесплатно
                      </span>
                    )}
                  </Button>
                  {!file && (
                    <p className="text-center text-xs text-muted-foreground">
                      ↑ Загрузите фото украшения для начала
                    </p>
                  )}
                  {file && !isGenerating && (
                    <p className="text-center text-xs text-muted-foreground">
                      1 бесплатная генерация · Без привязки карты
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ── Right: result ──────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card">

                {/* Generating animation */}
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-cream-50 to-rose-gold-50">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-rose-gold-300 animate-ping absolute inset-0 opacity-50" />
                      <div className="w-16 h-16 rounded-full border-2 border-rose-gold-400 animate-ping absolute inset-0 opacity-30 [animation-delay:0.3s]" />
                      <div className="w-16 h-16 rounded-full bg-rose-gold-100 flex items-center justify-center relative">
                        <Sparkles className="w-7 h-7 text-rose-gold-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground text-sm mb-1">ИИ создаёт ваш контент</p>
                      <p className="text-xs text-muted-foreground">Обычно занимает 5–10 секунд</p>
                    </div>
                    <div className="w-2/3 space-y-2">
                      {[100, 80, 60].map((w) => (
                        <div key={w} className="h-1.5 rounded-full shimmer" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Result image */}
                {resultUrl && !isGenerating && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultUrl}
                    alt="Сгенерированное изображение"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Empty placeholder */}
                {!isGenerating && !resultUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-rose-gold-50/50 via-transparent to-cream-200/30" />
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-cream-100 border border-cream-200 flex items-center justify-center">
                        <Sparkles className="w-7 h-7 text-rose-gold-300" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground/60 text-sm mb-0.5">
                          Здесь появится результат
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Загрузите фото и нажмите «Сгенерировать»
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Download gate — shown after generation */}
              {resultUrl && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="rounded-2xl bg-gradient-to-br from-rose-gold-50 to-cream-100 border border-rose-gold-200 p-5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-rose-gold-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lock className="w-4 h-4 text-rose-gold-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm leading-snug mb-1">
                        Зарегистрируйтесь, чтобы скачать
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Создайте бесплатный аккаунт — получите&nbsp;3 генерации
                        и скачивание в оригинальном качестве.
                      </p>
                    </div>
                  </div>

                  <Link href="/register">
                    <Button className="w-full bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow h-10">
                      Создать аккаунт бесплатно
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Уже есть аккаунт?{' '}
                    <Link href="/login" className="text-primary hover:underline">
                      Войти
                    </Link>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

// ── Already-used fallback card ─────────────────────────────────────────────────

function AlreadyUsedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: EASE }}
      className="max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl border border-cream-200 shadow-card p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="font-serif text-xl font-medium text-foreground mb-2">
          Вы уже пробовали генерацию!
        </h3>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Зарегистрируйтесь, чтобы получить&nbsp;3 бесплатные генерации,
          скачивание результатов и полный доступ к студии.
        </p>

        <Link href="/register">
          <Button className="w-full bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow h-11 mb-3">
            Создать аккаунт бесплатно
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
