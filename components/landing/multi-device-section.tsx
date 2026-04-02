'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Monitor, Smartphone, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

export function MultiDeviceSection() {
  const t = useTranslations('multiDevice')

  const features = [
    { icon: Monitor, label: t('feature1') },
    { icon: Smartphone, label: t('feature2') },
    { icon: Globe, label: t('feature3') },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual — device mockups */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-rose-gold-100/30 via-cream-200/20 to-transparent rounded-3xl blur-2xl" />
            <div className="relative flex items-end gap-4 justify-center">
              {/* Desktop mockup */}
              <div className="bg-white rounded-xl shadow-card border border-cream-200 overflow-hidden w-3/5">
                <div className="flex items-center gap-1 px-3 py-2 bg-cream-50 border-b border-cream-200">
                  <span className="w-2 h-2 rounded-full bg-rose-gold-300" />
                  <span className="w-2 h-2 rounded-full bg-rose-gold-200" />
                  <span className="w-2 h-2 rounded-full bg-cream-300" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-cream-200 rounded w-2/3" />
                  <div className="aspect-video bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-2 bg-cream-200 rounded flex-1" />
                    <div className="h-2 bg-cream-200 rounded flex-1" />
                  </div>
                </div>
              </div>
              {/* Mobile mockup */}
              <div className="bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden w-1/4">
                <div className="h-2 bg-cream-50 border-b border-cream-200" />
                <div className="p-2.5 space-y-2">
                  <div className="h-2 bg-cream-200 rounded w-3/4" />
                  <div className="aspect-square bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 rounded-lg" />
                  <div className="h-6 bg-rose-gold-400 rounded-lg" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          >
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-5 tracking-tight">
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {t('description')}
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {features.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-cream-200 rounded-full text-sm font-medium text-foreground"
                >
                  <Icon className="w-4 h-4 text-rose-gold-500" />
                  {label}
                </span>
              ))}
            </div>

            <Link href="/register">
              <Button
                size="lg"
                className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow group transition-all duration-300 h-12 px-7"
              >
                {t('cta')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
