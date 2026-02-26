'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { EASE } from '@/lib/motion'

const plans = [
  {
    id: 'start',
    name: 'Старт',
    price: '9 900',
    period: 'мес',
    description: 'Для магазинов, которые только начинают работать с ИИ-контентом',
    badge: null,
    credits: '30 генераций / мес',
    features: [
      'До 30 ИИ-фотографий в месяц',
      'Все базовые шаблоны поз',
      'Экспорт для Instagram и Kaspi',
      'Скачивание в высоком качестве',
      'Email-поддержка',
    ],
    notIncluded: ['Премиум-позы', 'Пакетная загрузка'],
    cta: 'Начать на тарифе Старт',
    highlighted: false,
  },
  {
    id: 'brand',
    name: 'Бренд Бизнес',
    price: '29 900',
    period: 'мес',
    description: 'Для активных брендов с большим объёмом контента',
    badge: 'Популярный выбор',
    credits: '150 генераций / мес',
    features: [
      'До 150 ИИ-фотографий в месяц',
      'Все шаблоны + эксклюзивные позы',
      'Приоритетная очередь генерации',
      'Экспорт для всех платформ',
      'Пакетная загрузка нескольких фото',
      'Приоритетная поддержка',
    ],
    notIncluded: [],
    cta: 'Выбрать Бренд Бизнес',
    highlighted: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-28 px-6 bg-gradient-to-b from-cream-200/30 to-[#FAF9F6]">
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
            Тарифы
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground mb-4 tracking-tight">
            Прозрачные цены
          </h2>
          <p className="text-muted-foreground text-lg">
            Оплата через Kaspi Pay. Отмена подписки в любой момент.
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
          Все тарифы включают{' '}
          <strong className="text-foreground">3 бесплатные генерации</strong>{' '}
          при регистрации. Попробуйте без риска — карта не нужна.
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
}: (typeof plans)[number]) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        highlighted
          ? 'bg-gradient-to-br from-rose-gold-500 via-rose-gold-500 to-rose-gold-600 text-white shadow-glow ring-1 ring-rose-gold-400'
          : 'bg-white border border-cream-200 hover:shadow-card hover:border-rose-gold-200'
      }`}
    >
      {/* Popular badge */}
      {badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 bg-white rounded-b-full shadow-soft">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-gold-600">
            <Sparkles className="w-3 h-3" />
            {badge}
          </span>
        </div>
      )}

      <div className="p-7 pt-8 flex flex-col flex-1">
        {/* Plan name + description */}
        <div className="mb-5">
          <h3
            className={`font-serif text-2xl font-medium mb-1.5 ${
              highlighted ? 'text-white' : 'text-foreground'
            }`}
          >
            {name}
          </h3>
          <p className={`text-sm leading-relaxed ${highlighted ? 'text-white/75' : 'text-muted-foreground'}`}>
            {description}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-3">
          <span
            className={`font-serif text-[2.5rem] font-bold leading-none tracking-tight ${
              highlighted ? 'text-white' : 'text-foreground'
            }`}
          >
            {price} ₸
          </span>
          <span className={`text-sm ${highlighted ? 'text-white/60' : 'text-muted-foreground'}`}>
            /{period}
          </span>
        </div>

        {/* Credits tag */}
        <span
          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 self-start ${
            highlighted
              ? 'bg-white/20 text-white'
              : 'bg-rose-gold-50 text-rose-gold-700'
          }`}
        >
          {credits}
        </span>

        {/* Features list */}
        <ul className="space-y-3 flex-1 mb-7">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  highlighted ? 'bg-white/20' : 'bg-rose-gold-100'
                }`}
              >
                <Check
                  className={`w-3 h-3 ${highlighted ? 'text-white' : 'text-rose-gold-600'}`}
                />
              </span>
              <span
                className={`text-sm leading-relaxed ${
                  highlighted ? 'text-white/90' : 'text-muted-foreground'
                }`}
              >
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

        {/* CTA */}
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
  )
}
