'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { EASE } from '@/lib/motion'

const GALLERY: { src: string; label: string }[] = [
  { src: '/examples/01.jpg', label: 'Кольцо с бриллиантом' },
  { src: '/examples/02.jpg', label: 'Золотые серьги' },
  { src: '/examples/03.jpg', label: 'Жемчужное колье' },
  { src: '/examples/04.jpg', label: 'Платиновый браслет' },
  { src: '/examples/05.jpg', label: 'Изумрудное кольцо' },
  { src: '/examples/06.jpg', label: 'Розовое золото' },
  { src: '/examples/07.jpg', label: 'Бриллиантовый браслет' },
  { src: '/examples/08.jpg', label: 'Сапфировые серьги' },
  { src: '/examples/09.jpg', label: 'Обручальное кольцо' },
  { src: '/examples/10.jpg', label: 'Рубиновая подвеска' },
  { src: '/examples/11.jpg', label: 'Белое золото' },
  { src: '/examples/12.jpg', label: 'Жёлтое золото' },
  { src: '/examples/13.jpg', label: 'Ювелирный гарнитур' },
  { src: '/examples/14.jpg', label: 'Кольцо с гравировкой' },
  { src: '/examples/15.jpg', label: 'Перстень' },
  { src: '/examples/16.jpg', label: 'Свадебные украшения' },
  { src: '/examples/17.jpg', label: 'Бриллиантовые серьги' },
  { src: '/examples/18.jpg', label: 'Кольцо с рубином' },
  { src: '/examples/19.jpg', label: 'Золотая цепочка' },
  { src: '/examples/20.jpg', label: 'Бриллиантовое колье' },
]

const ROW_1 = GALLERY.slice(0, 10)
const ROW_2 = GALLERY.slice(10, 20)

function GalleryCard({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative flex-shrink-0 w-56 h-64 rounded-2xl overflow-hidden border border-cream-200 shadow-card group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white text-xs font-medium truncate">{label}</p>
      </div>
    </div>
  )
}

function MarqueeRow({ items, reverse = false }: { items: typeof ROW_1; reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="flex overflow-hidden select-none">
      <div className={`flex gap-4 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        {doubled.map((item, i) => (
          <GalleryCard key={`${item.src}-${i}`} src={item.src} label={item.label} />
        ))}
      </div>
    </div>
  )
}

export function DemoSection() {
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
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Галерея результатов
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-3">
            Реальные результаты для наших клиентов
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
            Украшения казахстанских ювелирных магазинов — переработанные ИИ в профессиональные лайфстайл-фотографии.
          </p>
        </motion.div>

      </div>

      {/* ── Marquee rows (full-width, outside container) ──────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        className="flex flex-col gap-4"
      >
        <MarqueeRow items={ROW_1} />
        <MarqueeRow items={ROW_2} reverse />
      </motion.div>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        className="text-center mt-12"
      >
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-primary hover:bg-rose-gold-600 text-white font-semibold px-7 py-3.5 rounded-xl shadow-soft hover:shadow-glow transition-all duration-300 text-base"
        >
          Попробовать бесплатно
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-muted-foreground text-sm mt-3">3 генерации бесплатно · Без привязки карты</p>
      </motion.div>

    </section>
  )
}
