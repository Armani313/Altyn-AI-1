'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Flower2, Gem, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

type CategoryKey = 'apparel' | 'cosmetics' | 'jewelry'

export function CategoriesSection() {
  const t = useTranslations('categories')
  const [active, setActive] = useState<CategoryKey>('apparel')

  const categories: Array<{
    key: CategoryKey
    icon: typeof ShoppingBag
    title: string
    tag: string
    desc: string
    bullets: string[]
  }> = [
    {
      key: 'apparel',
      icon: ShoppingBag,
      title: t('apparelTitle'),
      tag: t('apparelTag'),
      desc: t('apparelDesc'),
      bullets: [t('apparelBullet1'), t('apparelBullet2'), t('apparelBullet3')],
    },
    {
      key: 'cosmetics',
      icon: Flower2,
      title: t('cosmeticsTitle'),
      tag: t('cosmeticsTag'),
      desc: t('cosmeticsDesc'),
      bullets: [t('cosmeticsBullet1'), t('cosmeticsBullet2'), t('cosmeticsBullet3')],
    },
    {
      key: 'jewelry',
      icon: Gem,
      title: t('jewelryTitle'),
      tag: t('jewelryTag'),
      desc: t('jewelryDesc'),
      bullets: [t('jewelryBullet1'), t('jewelryBullet2'), t('jewelryBullet3')],
    },
  ]

  const activeCategory = categories.find((c) => c.key === active)!
  const ActiveIcon = activeCategory.icon

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-gradient-to-b from-[#FAF9F6] via-cream-50/40 to-[#FAF9F6]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-10 sm:mb-12"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
            {t('overline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-foreground leading-tight tracking-tight mb-4 max-w-3xl mx-auto">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Tab selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: EASE }}
          className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10"
          role="tablist"
          aria-label="Product category"
        >
          {categories.map((cat) => {
            const Icon = cat.icon
            const isActive = active === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(cat.key)}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 min-h-[44px] ${
                  isActive
                    ? 'bg-primary text-white shadow-glow'
                    : 'bg-white border border-cream-200 text-foreground/70 hover:text-foreground hover:border-rose-gold-200 hover:bg-cream-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.title}
              </button>
            )
          })}
        </motion.div>

        {/* Active category card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative"
          >
            <div aria-hidden className="absolute -inset-4 bg-gradient-to-br from-rose-gold-100/40 via-rose-gold-50/20 to-cream-200/30 rounded-[2rem] blur-2xl" />

            <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-7 sm:gap-8 lg:gap-12 items-center bg-white rounded-2xl sm:rounded-3xl border border-cream-200 shadow-card p-6 sm:p-10 lg:p-12">
              {/* Content */}
              <div>
                <span className="inline-flex items-center gap-2 bg-rose-gold-50 text-rose-gold-700 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 sm:mb-5">
                  <ActiveIcon className="w-3.5 h-3.5" />
                  {activeCategory.tag}
                </span>
                <h3 className="font-serif text-[clamp(1.5rem,3.2vw,2.25rem)] font-medium text-foreground leading-tight tracking-tight mb-3 sm:mb-4">
                  {activeCategory.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-7 max-w-xl">
                  {activeCategory.desc}
                </p>

                <ul className="space-y-3 mb-6 sm:mb-8">
                  {activeCategory.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span className="mt-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-rose-gold-100 flex-shrink-0">
                        <Check className="w-3 h-3 text-rose-gold-700" />
                      </span>
                      <span className="text-sm text-foreground leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow group transition-all duration-300 h-12 px-6 sm:px-7 w-full sm:w-auto"
                    >
                      {t('cta')}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                  <Link href={`/categories/${active}`} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 border-cream-200 bg-white text-foreground hover:border-rose-gold-200 hover:text-rose-gold-700 px-6 sm:px-7 w-full sm:w-auto"
                    >
                      {t('learnMore')}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual */}
              <CategoryVisual kind={active} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function CategoryVisual({ kind }: { kind: CategoryKey }) {
  const palette: Record<CategoryKey, { from: string; to: string; accent: string; emoji: string }> = {
    apparel: {
      from: 'from-rose-gold-100',
      to: 'to-rose-gold-200',
      accent: 'bg-rose-gold-400',
      emoji: '👗',
    },
    cosmetics: {
      from: 'from-rose-gold-50',
      to: 'to-cream-200',
      accent: 'bg-rose-gold-300',
      emoji: '💄',
    },
    jewelry: {
      from: 'from-cream-100',
      to: 'to-rose-gold-100',
      accent: 'bg-rose-gold-500',
      emoji: '💍',
    },
  }

  const p = palette[kind]

  return (
    <div className="relative">
      {/* Before / After tiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div className="bg-cream-50 rounded-2xl p-3 border border-cream-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Before
            </span>
            <span className="text-[10px] text-muted-foreground">flat-lay</span>
          </div>
          <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-cream-100 to-cream-200 border border-cream-300 flex items-center justify-center">
            <span className="text-4xl opacity-40 grayscale">{p.emoji}</span>
          </div>
        </div>
        {/* After */}
        <div className={`bg-gradient-to-br ${p.from} ${p.to} rounded-2xl p-3 border border-rose-gold-200 relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-gold-700">
              After AI
            </span>
            <span className="text-[10px] text-rose-gold-700/70">on-model</span>
          </div>
          <div className="aspect-[3/4] rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-inner">
            <span className="text-5xl drop-shadow-md">{p.emoji}</span>
          </div>
          <span className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full ${p.accent} blur-2xl opacity-40`} />
        </div>
      </div>

      {/* Floating stat pill */}
      <div className="absolute -bottom-4 left-4 bg-white rounded-xl shadow-card border border-cream-200 px-3.5 py-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-semibold text-foreground">5.2s</span>
        <span className="text-[11px] text-muted-foreground">per shot</span>
      </div>
    </div>
  )
}
