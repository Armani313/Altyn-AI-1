'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

// ── После: примеры лайфстайл-фото, сгенерированных ИИ ────────────────────────
const AFTER_PHOTOS = [
  { src: '/models/1.jpeg', label: 'Колье' },
  { src: '/models/3.jpeg', label: 'Серьги' },
  { src: '/models/7.jpeg', label: 'Колье' },
  { src: '/models/9.jpeg', label: 'Украшение' },
  { src: '/models/4.jpeg', label: 'Серьги' },
  { src: '/models/5.jpeg', label: 'Кольцо' },
]

// ── Main ──────────────────────────────────────────────────────────────────────

export function DemoSection() {
  return (
    <section className="py-24 bg-cream-50 border-y border-cream-200 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 bg-rose-gold-100 text-rose-gold-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Результат за секунды
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-3">
            Одно фото&nbsp;— бесконечные образы
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
            Загрузите снимок украшения на любом фоне. ИИ превратит его
            в профессиональные лайфстайл-фото на&nbsp;моделях.
          </p>
        </motion.div>

        {/* ── Comparison layout ───────────────────────────────── */}
        <div className="flex flex-col lg:flex-row items-stretch gap-5 lg:gap-0">

          {/* ── БЫЛО (Before) ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="lg:w-[220px] xl:w-[260px] flex-shrink-0 flex flex-col"
          >
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-6 h-6 rounded-full bg-cream-300 flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                1
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Было
              </span>
            </div>

            {/* Product photo card */}
            <div className="relative flex-1 rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-soft">

              {/* Subtle grid texture */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.035]"
                style={{
                  backgroundImage:
                    'linear-gradient(#C4834F 1px, transparent 1px), linear-gradient(90deg, #C4834F 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              />

              {/* Glow in the center */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, hsl(30 33% 92%) 0%, transparent 65%)',
                }}
              />

              {/* Inner content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8">
                {/* Ring illustration */}
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-cream-100 border border-cream-200 flex items-center justify-center shadow-card text-5xl select-none">
                    💍
                  </div>
                  {/* Subtle sparkle dots */}
                  <span className="absolute -top-1 -right-1 text-rose-gold-300 text-base">✦</span>
                  <span className="absolute -bottom-1 -left-2 text-cream-300 text-sm">✦</span>
                </div>

                <div className="text-center">
                  <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">
                    Фото товара
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 leading-snug">
                    Снято на любом фоне,
                    <br />без студии
                  </p>
                </div>
              </div>

              {/* "Было" chip */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cream-200/80 backdrop-blur-sm text-muted-foreground px-2.5 py-1 rounded-full">
                  Было
                </span>
              </div>
            </div>
          </motion.div>

          {/* ── Arrow divider ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            className="flex lg:flex-col items-center justify-center gap-3 px-5 py-2 lg:py-0 flex-shrink-0"
          >
            {/* Pulse ring */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full gradient-rose-gold opacity-20 animate-ping" />
              <div className="relative w-11 h-11 rounded-full gradient-rose-gold flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-rose-gold-300 hidden lg:block" />
          </motion.div>

          {/* ── СТАЛО (After grid) ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex-1 flex flex-col"
          >
            {/* Label */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-6 h-6 rounded-full gradient-rose-gold flex items-center justify-center text-[11px] font-bold text-white shadow-soft">
                ∞
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-gold-600">
                Стало
              </span>
              <span className="ml-1 text-[10px] text-muted-foreground/60 font-medium">
                — лайфстайл-фото, созданные ИИ
              </span>
            </div>

            {/* 2×3 photo grid — 2 col on mobile for comfortable card size */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 lg:gap-3">
              {AFTER_PHOTOS.map((photo, i) => (
                <motion.div
                  key={photo.src}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
                  className="relative rounded-xl overflow-hidden group cursor-default shadow-soft hover:shadow-glow transition-shadow duration-300"
                  style={{ aspectRatio: '9/16' }}
                >
                  {/* Photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={`AI лайфстайл — ${photo.label}`}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                    draggable={false}
                    loading="lazy"
                  />

                  {/* Bottom gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                  {/* AI badge */}
                  <div className="absolute top-2 left-2">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-rose-gold-600 px-1.5 py-0.5 rounded-full shadow-sm">
                      <Sparkles className="w-2 h-2" />
                      AI
                    </span>
                  </div>

                  {/* Label on hover */}
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-[10px] font-semibold text-white/90 text-center leading-tight truncate">
                      {photo.label}
                    </p>
                  </div>

                  {/* Border glow on hover */}
                  <div className="absolute inset-0 rounded-xl ring-2 ring-rose-gold-300/0 group-hover:ring-rose-gold-300/60 transition-all duration-300" />
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ── CTA ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          className="text-center mt-14"
        >
          <Link href="/register">
            <Button className="h-12 px-8 text-base font-semibold bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-200">
              <Sparkles className="w-4 h-4 mr-2" />
              Попробовать бесплатно
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            3 бесплатные генерации · Без привязки карты
          </p>
        </motion.div>

      </div>
    </section>
  )
}
