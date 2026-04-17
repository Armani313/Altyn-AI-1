'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

const BeforeAfterCard = dynamic(() => Promise.resolve(BeforeAfterCardInner), { ssr: false })

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
})

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative pt-24 pb-14 sm:pb-20 lg:min-h-screen lg:flex lg:items-center overflow-hidden">
      {/* Background decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-rose-gold-100/50 via-rose-gold-50/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cream-200/60 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">

          {/* ── Text content ─────────────────────────────── */}
          <div>
            {/* Badge */}
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 bg-rose-gold-100 text-rose-gold-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                {t('badge')}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.08)}
              className="font-serif text-[clamp(1.75rem,5vw,3rem)] font-medium text-foreground leading-[1.15] tracking-tight mb-5 sm:mb-6"
            >
              {t('headline')}{' '}
              <em className="text-primary not-italic">{t('headlineEm')}</em>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp(0.16)}
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-[480px]"
            >
              {t('sub')}
            </motion.p>

            {/* Stats row */}
            <motion.div {...fadeUp(0.22)} className="flex items-center gap-6 mb-8">
              {[
                { icon: Zap,   label: t('statSpeed'), sub: t('statSpeedSub') },
                { icon: Clock, label: t('statSave'),  sub: t('statSaveSub')  },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-gold-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-rose-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow group transition-all duration-300 h-12 px-6 w-full sm:w-auto"
                >
                  {t('startFree')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-cream-300 text-muted-foreground hover:bg-cream-200 hover:text-foreground h-12 px-6 w-full sm:w-auto"
              >
                {t('examples')}
              </Button>
            </motion.div>

            <motion.p {...fadeUp(0.38)} className="mt-4 text-xs text-muted-foreground">
              {t('trust')}
            </motion.p>
          </div>

          {/* ── Before / After mock ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="w-full max-w-sm mx-auto lg:max-w-none"
          >
            <BeforeAfterCard />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function BeforeAfterCardInner() {
  const t = useTranslations('hero')
  const [afterMode, setAfterMode] = useState<'photo' | 'video'>('video')
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const switchToVideo = useCallback(() => setAfterMode('video'), [])

  const handleVideoEnded = useCallback(() => {
    setAfterMode('photo')
    timerRef.current = setTimeout(switchToVideo, 3000)
  }, [switchToVideo])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    if (afterMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [afterMode])

  return (
    <div className="relative">
      {/* Glow halo */}
      <div
        aria-hidden
        className="absolute -inset-6 bg-gradient-to-br from-rose-gold-200/30 via-rose-gold-100/20 to-cream-200/40 rounded-3xl blur-2xl"
      />

      <div className="relative bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-cream-50 border-b border-cream-200">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-gold-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-gold-200" />
          <span className="w-2.5 h-2.5 rounded-full bg-cream-300" />
          <span className="ml-2 text-[11px] text-muted-foreground font-medium flex-1 text-center pr-8">
            luminify.app
          </span>
        </div>

        {/* Split comparison */}
        <div className="grid grid-cols-2">
          {/* Before */}
          <div className="p-5 flex flex-col items-center gap-3 border-r border-cream-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('before')}
            </span>
            <div className="w-full aspect-square rounded-xl overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/jewelry-before.jpeg"
                alt={t('phonePic')}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-white drop-shadow">
                {t('phonePic')}
              </span>
            </div>
          </div>

          {/* After */}
          <div className="p-5 flex flex-col items-center gap-3 bg-gradient-to-br from-rose-gold-50 to-[#FDF5EE]">
            <div className="w-full flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-gold-600">
                <Sparkles className="w-3 h-3" />
                {t('afterAi')}
              </span>
              {/* Photo / Video toggle */}
              <div className="flex items-center gap-1 bg-white/60 rounded-lg p-0.5 border border-cream-200">
                <button
                  onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setAfterMode('photo') }}
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all ${afterMode === 'photo' ? 'bg-white shadow-sm text-rose-gold-600' : 'text-muted-foreground'}`}
                >
                  {t('photo')}
                </button>
                <button
                  onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setAfterMode('video') }}
                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-all ${afterMode === 'video' ? 'bg-white shadow-sm text-rose-gold-600' : 'text-muted-foreground'}`}
                >
                  {t('video')}
                </button>
              </div>
            </div>

            {/* Result media */}
            <div className="w-full aspect-square rounded-xl overflow-hidden relative shadow-soft">
              {afterMode === 'photo' ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/after1.png"
                  alt={t('lifestyle')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  src="/after2.mp4"
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-cover"
                />
              )}
              <span className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] text-white drop-shadow font-medium">
                {afterMode === 'photo' ? t('lifestyle') : t('videoClip')}
              </span>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cream-50 to-rose-gold-50 border-t border-cream-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-muted-foreground">
            {t('generationDone')}{' '}
            <span className="font-semibold text-foreground">4.2 {t('seconds')}</span>
          </span>
        </div>
      </div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -bottom-4 left-2 bg-white rounded-xl shadow-card border border-cream-200 px-3.5 py-2.5 flex items-center gap-2"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
          <span className="text-emerald-500 text-sm">✓</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground leading-none">{t('readyBadge')}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Instagram · Kaspi · сайт</p>
        </div>
      </motion.div>
    </div>
  )
}
