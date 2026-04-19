'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  Check,
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'
import { PLAN_META } from '@/lib/config/plans'
import type { Plan } from '@/types/database.types'

const PLAN_ORDER: Plan[] = ['free', 'starter', 'pro', 'business']

const PLAN_ICONS = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
  business: Building2,
} as const

export function PricingSection() {
  const tPricing = useTranslations('pricing')
  const tBilling = useTranslations('billingPlans')
  const locale = useLocale() === 'ru' ? 'ru' : 'en'

  const bannerCopy = locale === 'ru'
    ? {
        eyebrow: 'Актуальные тарифы',
        title: 'Тарифы на лендинге теперь совпадают с оплатой',
        body: `Начните с ${PLAN_META.free.credits} бесплатных генераций, а затем выберите объём под свой магазин: ${PLAN_META.starter.credits}, ${PLAN_META.pro.credits} или ${PLAN_META.business.credits} генераций в месяц.`,
        note: 'Все цены, лимиты и разовые пакеты кредитов соответствуют текущим тарифам в оплате.',
      }
    : {
        eyebrow: 'Live plans',
        title: 'The landing pricing now matches checkout',
        body: `Start with ${PLAN_META.free.credits} free generations, then scale to ${PLAN_META.starter.credits}, ${PLAN_META.pro.credits}, or ${PLAN_META.business.credits} generations per month based on your store volume.`,
        note: 'All prices, limits, and one-time credit packs match the current checkout setup.',
      }

  const plans = [
    {
      key: 'free' as const,
      label: tBilling('freeName'),
      description: locale === 'ru'
        ? 'Чтобы попробовать сервис без оплаты и быстро проверить качество результата.'
        : 'To try the service first and validate the output before paying.',
      credits: PLAN_META.free.credits,
      price: PLAN_META.free.monthlyPriceUsd,
      priceNote: tBilling('freeForever'),
      features: [tBilling('freeFeature1'), tBilling('freeFeature2'), tBilling('freeFeature3')],
      cta: locale === 'ru' ? 'Начать бесплатно' : 'Start free',
      badge: locale === 'ru' ? 'Без риска' : 'Risk-free',
      highlighted: false,
    },
    {
      key: 'starter' as const,
      label: tBilling('starterName'),
      description: locale === 'ru'
        ? 'Для небольшого каталога и первых регулярных генераций.'
        : 'For a smaller catalog and your first recurring generation workflow.',
      credits: PLAN_META.starter.credits,
      price: PLAN_META.starter.monthlyPriceUsd,
      priceNote: tBilling('perMonth'),
      features: [tBilling('starterFeature1'), tBilling('starterFeature2'), tBilling('starterFeature3'), tBilling('starterFeature4')],
      cta: locale === 'ru' ? 'Выбрать Старт' : 'Choose Starter',
      badge: null,
      highlighted: false,
    },
    {
      key: 'pro' as const,
      label: tBilling('proName'),
      description: locale === 'ru'
        ? 'Лучший баланс цены и объёма для активного магазина.'
        : 'The best balance of price and volume for an active store.',
      credits: PLAN_META.pro.credits,
      price: PLAN_META.pro.monthlyPriceUsd,
      priceNote: tBilling('perMonth'),
      features: [tBilling('proFeature1'), tBilling('proFeature2'), tBilling('proFeature3'), tBilling('proFeature4'), tBilling('proFeature5')],
      cta: locale === 'ru' ? 'Выбрать Про' : 'Choose Pro',
      badge: tBilling('popular'),
      highlighted: true,
    },
    {
      key: 'business' as const,
      label: tBilling('businessName'),
      description: locale === 'ru'
        ? 'Для команд и брендов, которым нужен большой месячный объём.'
        : 'For teams and brands that need a larger monthly content volume.',
      credits: PLAN_META.business.credits,
      price: PLAN_META.business.monthlyPriceUsd,
      priceNote: tBilling('perMonth'),
      features: [tBilling('businessFeature1'), tBilling('businessFeature2'), tBilling('businessFeature3'), tBilling('businessFeature4'), tBilling('businessFeature5')],
      cta: locale === 'ru' ? 'Выбрать Бизнес' : 'Choose Business',
      badge: locale === 'ru' ? 'Для команды' : 'For teams',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="scroll-mt-20 bg-gradient-to-b from-cream-200/30 to-[#FAF9F6] px-5 sm:px-6 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="mb-10 sm:mb-14 text-center"
        >
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
            {tPricing('overline')}
          </span>
          <h2 className="mb-3 sm:mb-4 font-serif text-[clamp(1.625rem,4vw,2.75rem)] font-medium tracking-tight text-foreground">
            {tPricing('title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {tPricing('sub')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-[2rem] border border-cream-200 bg-white p-5 shadow-card sm:p-8"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 top-0 h-48 w-48 rounded-full bg-rose-gold-100/70 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cream-200/70 blur-3xl" />
          </div>

          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-rose-gold-50/70 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] sm:tracking-[0.2em] text-rose-gold-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {bannerCopy.eyebrow}
              </span>
              <h3 className="mt-4 sm:mt-5 max-w-xl font-serif text-[clamp(1.375rem,3vw,2.35rem)] font-medium leading-tight tracking-tight text-foreground">
                {bannerCopy.title}
              </h3>
              <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
                {bannerCopy.body}
              </p>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-foreground/80">
                {bannerCopy.note}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {PLAN_ORDER.map((planKey) => {
                const Icon = PLAN_ICONS[planKey]
                const meta = PLAN_META[planKey]
                const label = planKey === 'free'
                  ? tBilling('freeName')
                  : planKey === 'starter'
                    ? tBilling('starterName')
                    : planKey === 'pro'
                      ? tBilling('proName')
                      : tBilling('businessName')

                return (
                  <div
                    key={planKey}
                    className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 ${
                      planKey === 'pro'
                        ? 'border-rose-gold-300 bg-gradient-to-br from-rose-gold-500 to-rose-gold-600 text-white shadow-glow'
                        : 'border-cream-200 bg-white/85'
                    }`}
                  >
                    <div className={`mb-2 sm:mb-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl ${
                      planKey === 'pro' ? 'bg-white/20' : 'bg-rose-gold-100'
                    }`}>
                      <Icon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${planKey === 'pro' ? 'text-white' : 'text-rose-gold-700'}`} />
                    </div>
                    <p className={`text-xs sm:text-sm font-semibold ${planKey === 'pro' ? 'text-white' : 'text-foreground'}`}>
                      {label}
                    </p>
                    <p className={`mt-1 font-serif text-xl sm:text-2xl font-bold ${planKey === 'pro' ? 'text-white' : 'text-foreground'}`}>
                      ${meta.monthlyPriceUsd}
                    </p>
                    <p className={`mt-1 text-[10px] sm:text-xs leading-tight ${planKey === 'pro' ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {planKey === 'free'
                        ? tBilling('freeForever')
                        : `${meta.credits} ${locale === 'ru' ? 'ген / мес' : 'gen / mo'}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.62, delay: index * 0.08, ease: EASE }}
            >
              <PlanCard
                name={plan.label}
                price={`$${plan.price}`}
                period={plan.priceNote}
                description={plan.description}
                badge={plan.badge}
                credits={tBilling('generations', { n: plan.credits })}
                features={plan.features}
                cta={plan.cta}
                highlighted={plan.highlighted}
              />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="mt-10 text-center text-sm text-muted-foreground"
        >
          <strong className="text-foreground">{tPricing('freeTrial')}</strong>{tPricing('freeTrialSub')}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45 }}
          className="mt-2 text-center text-xs text-muted-foreground"
        >
          {tBilling('nonAccumulationNote')}
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
  cta: string
  highlighted: boolean
}) {
  return (
    <div className="relative pt-4">
      {badge && (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-b-full bg-white px-4 py-1 shadow-soft">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-gold-600">
            <Sparkles className="h-3 w-3" />
            {badge}
          </span>
        </div>
      )}

      <div
        className={`relative flex h-full flex-col rounded-2xl transition-all duration-300 ${
          highlighted
            ? 'bg-gradient-to-br from-rose-gold-500 via-rose-gold-500 to-rose-gold-600 text-white shadow-glow ring-1 ring-rose-gold-400'
            : 'border border-cream-200 bg-white hover:border-rose-gold-200 hover:shadow-card'
        }`}
      >
        <div className="flex flex-1 flex-col p-6 sm:p-7 lg:p-5 xl:p-7">
          <div className="mb-4 sm:mb-5">
            <h3 className={`mb-1.5 font-serif text-xl sm:text-2xl lg:text-xl xl:text-2xl font-medium ${highlighted ? 'text-white' : 'text-foreground'}`}>
              {name}
            </h3>
            <p className={`text-sm leading-relaxed ${highlighted ? 'text-white/75' : 'text-muted-foreground'}`}>
              {description}
            </p>
          </div>

          <div className="mb-3 flex items-baseline gap-1.5">
            <span className={`font-serif text-[2.25rem] sm:text-[2.5rem] lg:text-[2rem] xl:text-[2.5rem] font-bold leading-none tracking-tight ${highlighted ? 'text-white' : 'text-foreground'}`}>
              {price}
            </span>
            <span className={`text-sm ${highlighted ? 'text-white/65' : 'text-muted-foreground'}`}>
              {period === 'forever' || period === 'навсегда' ? period : `/${period}`}
            </span>
          </div>

          <span className={`mb-5 sm:mb-6 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold ${
            highlighted ? 'bg-white/20 text-white' : 'bg-rose-gold-50 text-rose-gold-700'
          }`}>
            {credits}
          </span>

          <ul className="mb-6 sm:mb-7 flex-1 space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                  highlighted ? 'bg-white/20' : 'bg-rose-gold-100'
                }`}>
                  <Check className={`h-3 w-3 ${highlighted ? 'text-white' : 'text-rose-gold-600'}`} />
                </span>
                <span className={`text-sm leading-relaxed ${highlighted ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/register" className="block">
            <Button
              size="lg"
              className={`group h-11 w-full transition-all duration-200 ${
                highlighted
                  ? 'bg-white font-semibold text-rose-gold-600 hover:bg-white/90'
                  : 'bg-primary text-white hover:bg-rose-gold-600 hover:shadow-soft'
              }`}
            >
              {cta}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
