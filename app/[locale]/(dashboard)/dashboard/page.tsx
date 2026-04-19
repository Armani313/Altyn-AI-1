'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Gem, Wind, Glasses, Shirt, Layers, Watch, ShoppingBag, ArrowRight, Clapperboard, Sparkles } from 'lucide-react'
import { Header } from '@/components/dashboard/header'
import type { ProductType } from '@/lib/constants'

const CATEGORIES: {
  id: ProductType
  icon: React.ElementType
  gradient: string
  iconColor: string
}[] = [
  { id: 'jewelry',    icon: Gem,         gradient: 'from-rose-gold-100 to-rose-gold-50',   iconColor: 'text-rose-gold-600' },
  { id: 'scarves',    icon: Wind,        gradient: 'from-purple-100 to-purple-50',          iconColor: 'text-purple-600' },
  { id: 'headwear',   icon: Glasses,     gradient: 'from-sky-100 to-sky-50',                iconColor: 'text-sky-600' },
  { id: 'outerwear',  icon: Shirt,       gradient: 'from-emerald-100 to-emerald-50',        iconColor: 'text-emerald-600' },
  { id: 'bottomwear', icon: Layers,      gradient: 'from-amber-100 to-amber-50',            iconColor: 'text-amber-600' },
  { id: 'watches',    icon: Watch,       gradient: 'from-slate-100 to-slate-50',             iconColor: 'text-slate-600' },
  { id: 'bags',       icon: ShoppingBag, gradient: 'from-pink-100 to-pink-50',              iconColor: 'text-pink-600' },
]

export default function DashboardPage() {
  const t = useTranslations('dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('hubTitle')}
        subtitle={t('hubSubtitle')}
      />

      <div className="flex-1 p-4 sm:p-6 xl:p-8">
        <div className="max-w-[1200px] mx-auto">
          <Link
            href="/video"
            className="group relative mb-5 sm:mb-6 block overflow-hidden rounded-2xl sm:rounded-[30px] border border-rose-gold-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_rgba(255,247,240,0.95)_42%,_rgba(228,189,162,0.35)_100%)] p-5 shadow-soft transition-all duration-300 active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-card sm:p-7"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(196,131,79,0.16) 0%, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 20%, rgba(196,131,79,0.18), rgba(255,255,255,0) 35%)',
              }}
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-white/80 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-gold-600 backdrop-blur">
                  <Clapperboard className="h-3.5 w-3.5" />
                  {t('videoCtaEyebrow')}
                </div>
                <h2 className="mt-3 sm:mt-4 font-serif text-xl sm:text-2xl font-semibold tracking-tight text-foreground sm:text-[30px]">
                  {t('videoCtaTitle')}
                </h2>
                <p className="mt-2 sm:mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  {t('videoCtaDesc')}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-white/60 bg-white/75 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-foreground shadow-soft backdrop-blur">
                  <Sparkles className="h-4 w-4 text-rose-gold-500 flex-shrink-0" />
                  {t('videoCtaMeta')}
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-200 group-hover:gap-3">
                  {t('videoCtaButton')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map(({ id, icon: Icon, gradient, iconColor }) => (
              <Link
                key={id}
                href={`/dashboard/${id}`}
                className="group relative bg-white rounded-2xl border border-cream-200 p-4 sm:p-5 active:scale-[0.98] hover:border-rose-gold-200 hover:shadow-card transition-all duration-300 min-h-[150px] flex flex-col"
              >
                {/* Icon */}
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-105`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                  {t(id as Parameters<typeof t>[0])}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">
                  {t(`${id}Desc` as Parameters<typeof t>[0])}
                </p>

                {/* CTA */}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all duration-200">
                  {t('chooseCategory')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
