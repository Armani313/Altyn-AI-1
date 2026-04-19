'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Quote, ShoppingBag, Flower2, Gem } from 'lucide-react'
import { EASE } from '@/lib/motion'

export function TestimonialsSection() {
  const t = useTranslations('testimonials')

  const stories = [
    {
      quote: t('quote1'),
      author: t('author1'),
      company: t('company1'),
      tag: t('tag1'),
      icon: ShoppingBag,
      status: 'comingSoon' as const,
      bg: 'bg-gradient-to-br from-rose-gold-50 to-cream-50',
    },
    {
      quote: t('quote2'),
      author: t('author2'),
      company: t('company2'),
      tag: t('tag2'),
      icon: Flower2,
      status: 'comingSoon' as const,
      bg: 'bg-gradient-to-br from-cream-50 to-rose-gold-50',
    },
    {
      quote: t('quote3'),
      author: t('author3'),
      company: t('company3'),
      tag: t('tag3'),
      icon: Gem,
      status: 'case' as const,
      bg: 'bg-gradient-to-br from-rose-gold-50 to-cream-100',
    },
  ]

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6 bg-cream-50 border-y border-cream-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
            {t('overline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground tracking-tight">
            {t('title')}
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {stories.map((story, i) => {
            const Icon = story.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
              >
                <div
                  className={`relative rounded-2xl border border-cream-200 p-5 sm:p-7 h-full flex flex-col ${story.bg}`}
                >
                  {/* Category tag */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-cream-200 text-rose-gold-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                      <Icon className="w-3 h-3" />
                      {story.tag}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {story.status === 'case' ? t('caseBadge') : t('comingSoon')}
                    </span>
                  </div>

                  <Quote className="w-7 h-7 text-rose-gold-300 mb-4 flex-shrink-0" />
                  <blockquote className="text-sm text-foreground leading-relaxed mb-6 flex-1">
                    &ldquo;{story.quote}&rdquo;
                  </blockquote>
                  <div className="border-t border-cream-200 pt-4">
                    <p className="text-sm font-semibold text-foreground">{story.author}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{story.company}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
