'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
  Eraser,
  Square,
  Focus,
  Palette,
  ImagePlus,
  Sparkles,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react'
import { EASE } from '@/lib/motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

interface Tool {
  icon: typeof Eraser
  titleKey: string
  descKey: string
  href: string
}

interface Category {
  titleKey: string
  descKey: string
  tools: Tool[]
}

const CATEGORIES: Category[] = [
  {
    titleKey: 'catBgTitle',
    descKey: 'catBgDesc',
    tools: [
      { icon: Eraser, titleKey: 'toolRemoveBgTitle', descKey: 'toolRemoveBgDesc', href: '/tools/background-remover' },
      { icon: Square, titleKey: 'toolWhiteBgTitle', descKey: 'toolWhiteBgDesc', href: '/tools/white-background' },
      { icon: Focus, titleKey: 'toolBlurBgTitle', descKey: 'toolBlurBgDesc', href: '/tools/blur-background' },
      { icon: Palette, titleKey: 'toolChangeBgTitle', descKey: 'toolChangeBgDesc', href: '/tools/change-background-color' },
      { icon: ImagePlus, titleKey: 'toolAddBgTitle', descKey: 'toolAddBgDesc', href: '/tools/add-background' },
    ],
  },
  {
    titleKey: 'catAiTitle',
    descKey: 'catAiDesc',
    tools: [
      { icon: Sparkles, titleKey: 'toolGenerateTitle', descKey: 'toolGenerateDesc', href: '/editor' },
      { icon: LayoutGrid, titleKey: 'toolCardsTitle', descKey: 'toolCardsDesc', href: '/cards' },
    ],
  },
]

export function ToolsIndex() {
  const t = useTranslations('toolsPage')

  return (
    <section className="relative pt-28 pb-16 px-6">
      {/* Background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-rose-gold-100/50 via-rose-gold-50/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-16"
        >
          <h1 className="font-serif text-[clamp(2rem,5vw,3.25rem)] font-medium text-foreground leading-tight tracking-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </motion.div>

        {/* Categories */}
        <div className="space-y-20">
          {CATEGORIES.map((cat, catIdx) => (
            <motion.div
              key={cat.titleKey}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: catIdx * 0.1, ease: EASE }}
            >
              {/* Category header */}
              <div className="mb-8">
                <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2rem)] font-medium text-foreground tracking-tight mb-2">
                  {t(cat.titleKey)}
                </h2>
                <p className="text-muted-foreground text-base max-w-lg">
                  {t(cat.descKey)}
                </p>
              </div>

              {/* Tools grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="grid sm:grid-cols-2 gap-4"
              >
                {cat.tools.map((tool) => (
                  <motion.div key={tool.titleKey} variants={cardVariants}>
                    <Link href={tool.href} className="block group">
                      <div className="bg-white border border-cream-200 rounded-2xl p-6 hover:border-rose-gold-200 hover:shadow-card transition-all duration-300 h-full flex gap-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center group-hover:from-rose-gold-200 group-hover:to-rose-gold-300 transition-colors duration-300">
                          <tool.icon className="w-5 h-5 text-rose-gold-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-serif text-lg font-medium text-foreground">
                              {t(tool.titleKey)}
                            </h3>
                            <ArrowRight className="w-4 h-4 text-rose-gold-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t(tool.descKey)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
