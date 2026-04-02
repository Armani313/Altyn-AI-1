'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Gem, Wind, Glasses, Shirt, Layers, Watch, ShoppingBag, ArrowRight } from 'lucide-react'
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
        profile={null}
      />

      <div className="flex-1 p-4 sm:p-6 xl:p-8">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map(({ id, icon: Icon, gradient, iconColor }) => (
              <Link
                key={id}
                href={`/dashboard/${id}`}
                className="group relative bg-white rounded-2xl border border-cream-200 p-4 sm:p-5 hover:border-rose-gold-200 hover:shadow-card transition-all duration-300"
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
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
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
