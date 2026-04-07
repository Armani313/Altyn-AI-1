'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Gem, Layers2, MonitorSmartphone, Sparkles } from 'lucide-react'
import { EASE } from '@/lib/motion'

export function UpscaleFeatures() {
  const t = useTranslations('upscalePage')

  const features = [
    { icon: Sparkles, title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: Gem, title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: Layers2, title: t('feat3Title'), desc: t('feat3Desc') },
    { icon: MonitorSmartphone, title: t('feat4Title'), desc: t('feat4Desc') },
  ]

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
            >
              <div className="h-full rounded-2xl border border-cream-200 bg-white p-8 transition-all duration-300 hover:border-rose-gold-200 hover:shadow-card">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200">
                  <feature.icon className="h-6 w-6 text-rose-gold-700" />
                </div>
                <h3 className="mb-3 font-serif text-xl font-medium text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
