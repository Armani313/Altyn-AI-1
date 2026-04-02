'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Wand2, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

export function AllInOneSection() {
  const t = useTranslations('allInOne')

  const features = [
    { icon: Wand2, label: t('feature1') },
    { icon: Users, label: t('feature2') },
    { icon: Zap, label: t('feature3') },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
              {t('overline')}
            </span>
            <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight mb-5 tracking-tight">
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {t('description')}
            </p>

            <ul className="space-y-4 mb-8">
              {features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-gold-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-rose-gold-600" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </li>
              ))}
            </ul>

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

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-rose-gold-100/40 via-rose-gold-50/20 to-cream-200/40 rounded-3xl blur-2xl" />
            <div className="relative bg-white rounded-2xl shadow-card border border-cream-200 overflow-hidden">
              {/* Mock UI */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-cream-50 border-b border-cream-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-gold-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-rose-gold-200" />
                <span className="w-2.5 h-2.5 rounded-full bg-cream-300" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-3">
                  {/* Step 1 */}
                  <div className="bg-cream-50 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-rose-gold-100 flex items-center justify-center">
                      <span className="text-rose-gold-600 font-serif font-bold text-sm">1</span>
                    </div>
                    <div className="w-full aspect-square bg-cream-200 rounded-lg mb-2" />
                    <p className="text-[10px] text-muted-foreground">{t('step1')}</p>
                  </div>
                  {/* Step 2 */}
                  <div className="bg-cream-50 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-rose-gold-100 flex items-center justify-center">
                      <span className="text-rose-gold-600 font-serif font-bold text-sm">2</span>
                    </div>
                    <div className="w-full aspect-square bg-cream-200 rounded-lg mb-2" />
                    <p className="text-[10px] text-muted-foreground">{t('step2')}</p>
                  </div>
                  {/* Step 3 */}
                  <div className="bg-rose-gold-50 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-rose-gold-200 flex items-center justify-center">
                      <span className="text-rose-gold-600 font-serif font-bold text-sm">3</span>
                    </div>
                    <div className="w-full aspect-square bg-gradient-to-br from-rose-gold-200 to-rose-gold-300 rounded-lg mb-2" />
                    <p className="text-[10px] text-rose-gold-600 font-medium">{t('step3')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
