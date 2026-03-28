'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

export function PricingSection() {
  const t = useTranslations('pricing')

  const plans = [
    {
      id: 'start',
      name: t('startName'),
      price: '$1',
      period: t('per'),
      description: t('startDesc'),
      badge: null,
      credits: t('startCredits'),
      features: [t('startFeature1'), t('startFeature2'), t('startFeature3')],
      notIncluded: [t('startNotIncluded1'), t('startNotIncluded2')],
      cta: t('startCta'),
      highlighted: false,
    },
    {
      id: 'brand',
      name: t('proName'),
      price: '$20',
      period: t('per'),
      description: t('proDesc'),
      badge: t('proBadge'),
      credits: t('proCredits'),
      features: [t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4'), t('proFeature5')],
      notIncluded: [] as string[],
      cta: t('proCta'),
      highlighted: true,
    },
  ]

  return (
    <section id="pricing" className="py-28 px-6 scroll-mt-20 bg-gradient-to-b from-cream-200/30 to-[#FAF9F6]">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
            {t('overline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground mb-4 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t('sub')}
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: i * 0.12, ease: EASE }}
            >
              <PlanCard {...plan} />
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10 text-sm text-muted-foreground"
        >
          <strong className="text-foreground">{t('freeTrial')}</strong>{t('freeTrialSub')}
        </motion.p>
      </div>
    </section>
  )
}

function PlanCard({
  name,
  price,
  period,
  description,
  badge,
  credits,
  features,
  notIncluded,
  cta,
  highlighted,
}: {
  name: string
  price: string
  period: string
  description: string
  badge: string | null
  credits: string
  features: string[]
  notIncluded: string[]
  cta: string
  highlighted: boolean
}) {
  return (
    <div className="relative pt-4">
      {badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-4 py-1 bg-white rounded-b-full shadow-soft whitespace-nowrap">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-gold-600">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        </div>
      )}

      <div
        className={`relative flex flex-col rounded-2xl transition-all duration-300 ${
          highlighted
            ? 'bg-gradient-to-br from-rose-gold-500 via-rose-gold-500 to-rose-gold-600 text-white shadow-glow ring-1 ring-rose-gold-400'
            : 'bg-white border border-cream-200 hover:shadow-card hover:border-rose-gold-200'
        }`}
      >
        <div className="p-7 flex flex-col flex-1">
          <div className="mb-5">
            <h3 className={`font-serif text-2xl font-medium mb-1.5 ${highlighted ? 'text-white' : 'text-foreground'}`}>
              {name}
            </h3>
            <p className={`text-sm leading-relaxed ${highlighted ? 'text-white/75' : 'text-muted-foreground'}`}>
              {description}
            </p>
          </div>

          <div className="flex items-baseline gap-1.5 mb-3">
            <span className={`font-serif text-[2.5rem] font-bold leading-none tracking-tight ${highlighted ? 'text-white' : 'text-foreground'}`}>
              {price}
            </span>
            <span className={`text-sm ${highlighted ? 'text-white/60' : 'text-muted-foreground'}`}>
              /{period}
            </span>
          </div>

          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 self-start ${
            highlighted ? 'bg-white/20 text-white' : 'bg-rose-gold-50 text-rose-gold-700'
          }`}>
            {credits}
          </span>

          <ul className="space-y-3 flex-1 mb-7">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${highlighted ? 'bg-white/20' : 'bg-rose-gold-100'}`}>
                  <Check className={`w-3 h-3 ${highlighted ? 'text-white' : 'text-rose-gold-600'}`} />
                </span>
                <span className={`text-sm leading-relaxed ${highlighted ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {f}
                </span>
              </li>
            ))}
            {notIncluded.map((f) => (
              <li key={f} className="flex items-start gap-3 opacity-40">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground text-xs leading-none">—</span>
                </span>
                <span className="text-sm text-muted-foreground line-through">{f}</span>
              </li>
            ))}
          </ul>

          <Link href="/register" className="block">
            <Button
              size="lg"
              className={`w-full h-11 group transition-all duration-200 ${
                highlighted
                  ? 'bg-white text-rose-gold-600 hover:bg-white/90 font-semibold'
                  : 'bg-primary hover:bg-rose-gold-600 text-white hover:shadow-soft'
              }`}
            >
              {cta}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
