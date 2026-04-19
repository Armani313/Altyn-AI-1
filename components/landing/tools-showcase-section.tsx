'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { Camera, LayoutGrid, Eraser, Palette, Users, Layers, ArrowRight } from 'lucide-react'
import { EASE } from '@/lib/motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export function ToolsShowcaseSection() {
  const t = useTranslations('toolsShowcase')

  const tools = [
    { icon: Camera, title: t('tool1Title'), desc: t('tool1Desc'), href: '/dashboard' },
    { icon: LayoutGrid, title: t('tool2Title'), desc: t('tool2Desc'), href: '/dashboard' },
    { icon: Eraser, title: t('tool3Title'), desc: t('tool3Desc'), href: '/dashboard' },
    { icon: Palette, title: t('tool4Title'), desc: t('tool4Desc'), href: '/dashboard' },
    { icon: Users, title: t('tool5Title'), desc: t('tool5Desc'), href: '/dashboard' },
    { icon: Layers, title: t('tool6Title'), desc: t('tool6Desc'), href: '/dashboard' },
  ]

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-6">
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
          <h2 className="font-serif text-[clamp(1.625rem,4vw,2.5rem)] font-medium text-foreground mb-3 sm:mb-4 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {tools.map((tool) => (
            <motion.div key={tool.title} variants={cardVariants}>
              <Link href={tool.href} className="block group">
                <div className="relative bg-white border border-cream-200 rounded-2xl p-5 sm:p-6 hover:border-rose-gold-200 hover:shadow-card transition-all duration-300 h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-gold-50/0 to-rose-gold-100/0 group-hover:from-rose-gold-50/50 group-hover:to-rose-gold-50/20 transition-all duration-300 rounded-2xl" />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center mb-4 group-hover:from-rose-gold-200 group-hover:to-rose-gold-300 transition-colors duration-300">
                      <tool.icon className="w-5 h-5 text-rose-gold-700" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-foreground mb-2">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          className="text-center mt-10"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-rose-gold-600 transition-colors group"
          >
            {t('seeAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
