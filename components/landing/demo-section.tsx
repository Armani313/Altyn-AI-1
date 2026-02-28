'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Camera, X, Lock, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_MB, MAX_IMAGE_BYTES } from '@/lib/constants'

type DemoState = 'idle' | 'generating' | 'done' | 'used' | 'error'

export function DemoSection() {
  const [file, setFile]           = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [demoState, setDemoState] = useState<DemoState>('idle')
  const [errorMsg, setErrorMsg]   = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((f: File) => {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type)) {
      setErrorMsg('Поддерживаются JPG, PNG, WEBP, HEIC')
      return
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setErrorMsg(`Максимальный размер — ${MAX_IMAGE_MB} МБ`)
      return
    }
    setErrorMsg('')
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f) })
    setFile(f)
    setResultUrl(null)
    setDemoState('idle')
  }, [])

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setDemoState('idle')
    setErrorMsg('')
  }

  const handleGenerate = async () => {
    if (!file) return
    setDemoState('generating')
    setErrorMsg('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res  = await fetch('/api/generate/demo', { method: 'POST', body: fd })
      const data = await res.json()

      if (res.status === 429) { setDemoState('used'); return }
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Ошибка генерации. Попробуйте снова.')
        setDemoState('error')
        return
      }
      setResultUrl(data.outputUrl)
      setDemoState('done')
    } catch {
      setErrorMsg('Ошибка соединения. Проверьте интернет.')
      setDemoState('error')
    }
  }

  return (
    <section className="py-24 bg-cream-50 border-y border-cream-200 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* ── Header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 bg-rose-gold-100 text-rose-gold-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Попробуйте прямо сейчас
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-3">
            Загрузите фото — получите результат
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
            Одна бесплатная генерация без регистрации.
            Зарегистрируйтесь — получите ещё&nbsp;3 генерации и возможность скачивания.
          </p>
        </motion.div>

        {/* ── Interactive demo ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-5 items-start"
        >

          {/* ── Left: Upload ───────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cream-300 flex items-center justify-center text-[11px] font-bold text-muted-foreground">1</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ваше украшение</span>
            </div>

            {!previewUrl ? (
              <div
                onDragOver={(e)  => { e.preventDefault(); setIsDragging(true)  }}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true)  }}
                onDragLeave={()  => setIsDragging(false)}
                onDrop={(e)      => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 touch-manipulation ${
                  isDragging
                    ? 'border-primary bg-rose-gold-50 scale-[1.01] shadow-glow'
                    : 'border-cream-300 bg-white hover:border-rose-gold-300 hover:bg-rose-gold-50/40'
                }`}
              >
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-rose-gold-200' : 'bg-rose-gold-100'}`}>
                    <Camera className="w-7 h-7 text-rose-gold-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      <span className="hidden sm:inline">{isDragging ? 'Отпустите здесь' : 'Перетащите фото украшения'}</span>
                      <span className="sm:hidden">Нажмите, чтобы загрузить</span>
                    </p>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      или <span className="text-primary font-medium underline underline-offset-2">выберите файл</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground bg-cream-100 rounded-lg px-3 py-1.5">
                    JPG, PNG, WEBP · до {MAX_IMAGE_MB} МБ
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
                />
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-cream-200 shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Ваше украшение" className="w-full h-full object-cover" />
                {demoState !== 'generating' && (
                  <button
                    onClick={handleRemove}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-soft">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Фото загружено
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Generate button — hide after done/used */}
            {demoState !== 'done' && demoState !== 'used' && (
              <Button
                onClick={handleGenerate}
                disabled={!file || demoState === 'generating'}
                className={`h-12 text-base font-semibold transition-all duration-300 ${
                  file && demoState !== 'generating'
                    ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {demoState === 'generating' ? (
                  <span className="flex items-center gap-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Генерируем...
                  </span>
                ) : (
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5" />
                    {file ? 'Сгенерировать бесплатно' : 'Загрузите фото выше'}
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* ── Right: Result ───────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full gradient-rose-gold flex items-center justify-center text-[11px] font-bold text-white shadow-soft">AI</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-gold-600">Результат</span>
            </div>

            <div className="relative aspect-square rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card">

              {/* Generating skeleton */}
              {demoState === 'generating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-cream-50 to-rose-gold-50">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-rose-gold-300 animate-ping absolute inset-0 opacity-50" />
                    <div className="w-16 h-16 rounded-full bg-rose-gold-100 flex items-center justify-center relative">
                      <Sparkles className="w-7 h-7 text-rose-gold-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm mb-1">ИИ создаёт лайфстайл-фото</p>
                    <p className="text-xs text-muted-foreground">Обычно 5–15 секунд</p>
                  </div>
                  <div className="w-2/3 space-y-2">
                    {[100, 80, 60].map((w) => (
                      <div key={w} className="h-1.5 rounded-full shimmer" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Result: blurred image + lock overlay */}
              {demoState === 'done' && resultUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultUrl}
                    alt="Результат генерации"
                    className="w-full h-full object-cover blur-sm scale-105"
                  />
                  <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-base mb-1.5">Результат готов!</p>
                      <p className="text-white/80 text-sm leading-snug">
                        Зарегистрируйтесь бесплатно —<br />скачайте фото и получите ещё 3 генерации
                      </p>
                    </div>
                    <Link href="/register" className="w-full">
                      <Button className="w-full bg-white text-primary hover:bg-cream-50 font-semibold shadow-lg h-11">
                        Зарегистрироваться бесплатно
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/login" className="text-white/70 text-xs hover:text-white transition-colors">
                      Уже есть аккаунт? Войти
                    </Link>
                  </div>
                </>
              )}

              {/* Already used */}
              {demoState === 'used' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-br from-cream-50 to-rose-gold-50">
                  <div className="w-14 h-14 rounded-full bg-rose-gold-100 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-rose-gold-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base mb-1">Демо уже использовано</p>
                    <p className="text-muted-foreground text-sm leading-snug">
                      Создайте аккаунт и получите 3 бесплатные генерации с возможностью скачивания
                    </p>
                  </div>
                  <Link href="/register" className="w-full">
                    <Button className="w-full bg-primary hover:bg-rose-gold-600 text-white font-semibold shadow-soft hover:shadow-glow h-11">
                      Создать аккаунт бесплатно
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Empty state */}
              {(demoState === 'idle' || demoState === 'error') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-rose-gold-50/50 via-transparent to-cream-200/30" />
                  <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-cream-100 border border-cream-200 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground/70 text-sm mb-0.5">Здесь появится результат</p>
                      <p className="text-xs text-muted-foreground">Загрузите фото и нажмите «Сгенерировать»</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(demoState === 'done' || demoState === 'used') && (
              <p className="text-center text-xs text-muted-foreground">
                3 бесплатные генерации · Без привязки карты
              </p>
            )}
          </div>

        </motion.div>
      </div>
    </section>
  )
}
