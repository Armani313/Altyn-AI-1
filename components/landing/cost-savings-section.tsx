'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { EASE } from '@/lib/motion'

export function CostSavingsSection() {
  const t = useTranslations('costSavings')

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
  ]

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-cream-50 border-y border-cream-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          {/* Visual — left side */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-cream-200/40 via-rose-gold-50/20 to-cream-100/40 rounded-3xl blur-2xl" />
            <div className="relative bg-white rounded-2xl shadow-card border border-cream-200 p-5 sm:p-8">
              {/* Cost comparison */}
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-red-700">{t('traditional')}</p>
                    <p className="text-xs text-red-500 mt-0.5">{t('traditionalSub')}</p>
                  </div>
                  <span className="font-serif text-2xl font-bold text-red-600">{t('traditionalPrice')}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-muted-foreground text-sm font-medium">{t('vs')}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Luminify</p>
                    <p className="text-xs text-emerald-500 mt-0.5">{t('luminifySub')}</p>
                  </div>
                  <span className="font-serif text-2xl font-bold text-emerald-600">{t('luminifyPrice')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text — right side */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
              {t('overline')}
            </span>
            <h2 className="font-serif text-[clamp(1.625rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-4 sm:mb-5 tracking-tight">
              {t('title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 sm:mb-10 max-w-lg">
              {t('description')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="font-serif text-2xl sm:text-3xl font-bold text-primary leading-none">{value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
