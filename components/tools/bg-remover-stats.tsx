'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { EASE } from '@/lib/motion'

export function BgRemoverStats() {
  const t = useTranslations('bgRemoverPage')

  const stats = [
    { value: t('statVal1'), label: t('statLabel1') },
    { value: t('statVal2'), label: t('statLabel2') },
    { value: t('statVal3'), label: t('statLabel3') },
    { value: t('statVal4'), label: t('statLabel4') },
  ]

  return (
    <section className="py-16 px-6 bg-cream-50 border-y border-cream-200">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map(({ value, label }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="text-center"
            >
              <p className="font-serif text-4xl font-bold text-primary leading-none mb-2">
                {value}
              </p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
