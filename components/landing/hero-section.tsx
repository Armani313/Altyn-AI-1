'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
})

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-14 sm:pb-20 lg:min-h-screen lg:flex lg:items-center overflow-hidden">
      {/* Background decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
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
                ИИ для ювелирных магазинов
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.08)}
              className="font-serif text-[clamp(1.75rem,5vw,3rem)] font-medium text-foreground leading-[1.15] tracking-tight mb-5 sm:mb-6"
            >
              Контент для украшений —{' '}
              <em className="text-primary not-italic">без фотосессий.</em>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp(0.16)}
              className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-[480px]"
            >
              Загрузите фото украшения — получите профессиональный
              лайфстайл-снимок за секунды. Без модели и студии.
            </motion.p>

            {/* Stats row */}
            <motion.div
              {...fadeUp(0.22)}
              className="flex items-center gap-6 mb-8"
            >
              {[
                { icon: Zap, label: '~5 секунд', sub: 'на генерацию' },
                { icon: Clock, label: 'Экономия', sub: 'до 90% бюджета' },
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
                  Начать бесплатно
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-cream-300 text-muted-foreground hover:bg-cream-200 hover:text-foreground h-12 px-6 w-full sm:w-auto"
              >
                Смотреть примеры
              </Button>
            </motion.div>

            <motion.p
              {...fadeUp(0.38)}
              className="mt-4 text-xs text-muted-foreground"
            >
              3 генерации бесплатно · Без привязки карты · Отмена в любой момент
            </motion.p>
          </div>

          {/* ── Before / After mock — desktop only ──────── */}
          <motion.div
            initial={{ opacity: 0, x: 48, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="hidden lg:block"
          >
            <BeforeAfterCard />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function BeforeAfterCard() {
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
            studio.nurai.kz
          </span>
        </div>

        {/* Split comparison */}
        <div className="grid grid-cols-2">
          {/* Before */}
          <div className="p-5 flex flex-col items-center gap-3 border-r border-cream-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              До
            </span>

            {/* Plain product photo simulation */}
            <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#F5F5F5] to-[#E8E8E8] flex items-center justify-center relative overflow-hidden">
              {/* Ring silhouette */}
              <svg
                viewBox="0 0 80 80"
                className="w-24 h-24 text-[#C8C8C8]"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <ellipse cx="40" cy="40" rx="22" ry="22" />
                <ellipse cx="40" cy="40" rx="14" ry="14" />
                <ellipse cx="40" cy="22" rx="6" ry="4" fill="currentColor" strokeWidth="0" opacity="0.5" />
              </svg>
              <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-[#AAAAAA]">
                фото на телефон
              </span>
            </div>
          </div>

          {/* After */}
          <div className="p-5 flex flex-col items-center gap-3 bg-gradient-to-br from-rose-gold-50 to-[#FDF5EE]">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-rose-gold-600">
              <Sparkles className="w-3 h-3" />
              После AI
            </span>

            {/* Lifestyle photo simulation */}
            <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-rose-gold-200 via-[#D4946A] to-rose-gold-400 flex items-center justify-center relative overflow-hidden shadow-soft">
              {/* Warm ambient light */}
              <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/10 to-white/20" />

              {/* Stylised hand + ring */}
              <div className="relative flex items-end justify-center h-full w-full pb-4">
                {/* Palm */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 items-end">
                  {/* Fingers */}
                  {[28, 36, 34, 28].map((h, i) => (
                    <div
                      key={i}
                      className="rounded-full bg-gradient-to-b from-[#F5D5C0] to-[#E8BAA0] relative"
                      style={{ width: 10, height: h }}
                    >
                      {/* Ring on middle finger */}
                      {i === 1 && (
                        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[18px] h-[7px] -translate-x-[4px]">
                          <div className="w-full h-full rounded-full bg-gradient-to-r from-[#E8C99A] via-[#F5E0B8] to-[#C4934F] shadow-md" />
                          {/* Stone */}
                          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-3 h-2.5 rounded-sm bg-gradient-to-br from-white/90 to-white/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Soft bokeh orbs */}
                <div className="absolute top-4 right-6 w-8 h-8 rounded-full bg-white/20 blur-sm" />
                <div className="absolute top-8 left-4 w-5 h-5 rounded-full bg-white/15 blur-sm" />
              </div>

              <span className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] text-white/80 font-medium">
                лайфстайл фото
              </span>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cream-50 to-rose-gold-50 border-t border-cream-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-muted-foreground">
            Генерация завершена за{' '}
            <span className="font-semibold text-foreground">4.2 секунды</span>
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
          <p className="text-[11px] font-semibold text-foreground leading-none">Готово к публикации</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Instagram · Kaspi · сайт</p>
        </div>
      </motion.div>
    </div>
  )
}
