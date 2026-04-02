'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

export function WhiteBgFeatures() {
  const t = useTranslations('whiteBgPage')

  const features = [
    { title: t('block1Title'), desc: t('block1Desc'), inverted: false },
    { title: t('block2Title'), desc: t('block2Desc'), inverted: true },
    { title: t('block3Title'), desc: t('block3Desc'), inverted: false },
    { title: t('block4Title'), desc: t('block4Desc'), inverted: true },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto space-y-20">
        {features.map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
              feat.inverted ? 'lg:direction-rtl' : ''
            }`}
          >
            {/* Text */}
            <div className={feat.inverted ? 'lg:order-2' : ''}>
              <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2.25rem)] font-medium text-foreground leading-tight mb-5 tracking-tight">
                {feat.title}
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                {feat.desc}
              </p>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="border-rose-gold-200 text-rose-gold-700 hover:bg-rose-gold-50 group gap-2"
                >
                  {t('featureCta')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
            </div>

            {/* Visual placeholder */}
            <div className={feat.inverted ? 'lg:order-1' : ''}>
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-rose-gold-100/30 via-cream-200/20 to-transparent rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden aspect-[4/3]">
                  <div className="w-full h-full bg-gradient-to-br from-cream-100 to-rose-gold-50 flex items-center justify-center">
                    <div className="w-2/3 aspect-square rounded-xl bg-white shadow-soft flex items-center justify-center">
                      <div className="w-1/2 aspect-square bg-gradient-to-br from-rose-gold-200 to-rose-gold-400 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
