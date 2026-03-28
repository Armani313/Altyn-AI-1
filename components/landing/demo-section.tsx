'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { EASE } from '@/lib/motion'

const GALLERY: string[] = [
  '/examples/hf_20260309_090944_181c07c5-1859-48f5-adcb-adad853a4359.jpeg',
  '/examples/hf_20260309_091339_c63663cf-1940-4bb5-988c-32b7367a63da.jpeg',
  '/examples/hf_20260309_100705_5ae3050b-b4c2-41f8-8321-fe15ee688dd2.jpeg',
  '/examples/hf_20260309_100716_9e1b2c51-3176-411c-bea3-ee09229b5c1d.jpeg',
  '/examples/hf_20260309_100754_159869fe-1384-4d12-b080-38b08432e12f.jpeg',
  '/examples/hf_20260309_100805_74ac7b57-8b5d-4eab-8534-871a80daeb06.jpeg',
  '/examples/hf_20260309_100946_e8f23a6b-3692-4f0b-9a7a-b5ec3c71e146.jpeg',
  '/examples/hf_20260309_101146_d00781c1-567e-44ef-b3e0-3375aea94882.jpeg',
  '/examples/hf_20260309_101324_0ef08ea8-da9b-40dc-9e4f-70633771d096.jpeg',
  '/examples/hf_20260309_101337_e8cba187-b823-4a3e-9214-809856ac4b6f.jpeg',
  '/examples/hf_20260309_101400_47df8ee7-354e-433f-b88c-4a6a3c17d847.jpeg',
  '/examples/hf_20260309_101506_a9272f5b-67dc-474b-a8b6-60e4265dd993.jpeg',
  '/examples/hf_20260309_101526_5b19ce3a-53f0-4209-b205-88c84697f64f.jpeg',
  '/examples/hf_20260309_101555_388887e3-ac74-4f1d-bc3f-c2b45f102489.jpeg',
  '/examples/hf_20260309_101706_9c1f54f0-8e12-49ea-9aad-7b59ba74593d.jpeg',
  '/examples/hf_20260309_102059_56498183-d54a-4f99-86ea-89a838feadc1.jpeg',
  '/examples/hf_20260309_102108_ba7dc28c-782e-425b-a9d5-e76c8d0b9120.jpeg',
  '/examples/hf_20260309_102118_117c83bc-7ca3-4016-bce1-f511efdddbfd.jpeg',
  '/examples/hf_20260309_102225_45338418-938e-4beb-9c93-619d25e2c44c.jpeg',
  '/examples/hf_20260309_102243_0dab95c5-cd31-4dc1-a92e-5c36f17e0531.jpeg',
  '/examples/hf_20260309_102257_02257779-0701-4b52-816d-f9bf33faee3d.jpeg',
  '/examples/hf_20260309_102316_cb3d2c39-f510-42fe-a0cf-7bee41cbc259.jpeg',
  '/examples/hf_20260309_102353_3c7782e5-d889-4579-b904-654c5e0d2e4e.jpeg',
  '/examples/hf_20260309_102402_3ef32fb0-ebe3-41f0-a16d-5a203030596f.jpeg',
  '/examples/hf_20260309_102424_394f0c30-a498-4a3d-ad4b-9279e7340f29.jpeg',
]

const ROW_1 = GALLERY.slice(0, 13)
const ROW_2 = GALLERY.slice(13)

const GalleryRows = dynamic(() => Promise.resolve(GalleryRowsInner), { ssr: false })

function GalleryCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative flex-shrink-0 w-56 h-64 rounded-2xl overflow-hidden border border-cream-200 shadow-card group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  )
}

function MarqueeRow({ items, alt, reverse = false }: { items: string[]; alt: string; reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="flex overflow-hidden select-none">
      <div className={`flex gap-4 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        {doubled.map((src, i) => (
          <GalleryCard key={`${src}-${i}`} src={src} alt={alt} />
        ))}
      </div>
    </div>
  )
}

function GalleryRowsInner() {
  const t = useTranslations('demoSection')
  return (
    <>
      <MarqueeRow items={ROW_1} alt={t('imageAlt')} />
      <MarqueeRow items={ROW_2} alt={t('imageAlt')} reverse />
    </>
  )
}

export function DemoSection() {
  const t = useTranslations('demoSection')

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
            {t('badge')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-3">
            {t('title')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
            {t('sub')}
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
        <GalleryRows />
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
          {t('cta')}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-muted-foreground text-sm mt-3">{t('ctaSub')}</p>
      </motion.div>

    </section>
  )
}
