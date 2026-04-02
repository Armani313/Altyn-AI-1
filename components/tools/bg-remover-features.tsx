'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Clock, DollarSign, TrendingUp, Sparkles } from 'lucide-react'
import { EASE } from '@/lib/motion'

export function BgRemoverFeatures() {
  const t = useTranslations('bgRemoverPage')

  const features = [
    {
      icon: Clock,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
    },
    {
      icon: DollarSign,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
    },
    {
      icon: TrendingUp,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
    },
    {
      icon: Sparkles,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            >
              <div className="bg-white rounded-2xl border border-cream-200 p-8 hover:shadow-card hover:border-rose-gold-200 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center mb-5">
                  <feat.icon className="w-6 h-6 text-rose-gold-700" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                  {feat.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
