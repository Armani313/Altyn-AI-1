'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
  Eraser,
  Square,
  Focus,
  Palette,
  ImagePlus,
  Maximize2,
  Sparkles,
  LayoutGrid,
  ArrowRight,
  Clapperboard,
  ImageUp,
  ScanSearch,
  SunMedium,
  UserRound,
  ScanFace,
  Wand2,
} from 'lucide-react'
import { EASE } from '@/lib/motion'
import { getLocalizedTopazTools, type LocalizedTopazTool } from '@/lib/tools/topaz-tools'

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
  title: string
  description: string
  href: string
  badge?: string
}

interface Category {
  title: string
  description: string
  tools: Tool[]
}

function getToolIcon(tool: LocalizedTopazTool): typeof Eraser {
  switch (tool.slug) {
    case 'image-enhancer':
    case 'image-enlarger':
    case 'image-upscaler':
    case '3d-model-upscaler':
      return ImageUp
    case 'image-sharpener':
      return ScanSearch
    case 'image-unblur':
      return Focus
    case 'image-denoiser':
      return Sparkles
    case 'face-enhancer':
      return UserRound
    case 'photo-lighting':
      return SunMedium
    case 'photo-restoration':
      return ScanFace
    case 'ai-art-enhancer':
      return Wand2
    default:
      return tool.runtime === 'video' ? Clapperboard : Sparkles
  }
}

export function ToolsIndex() {
  const t = useTranslations('toolsPage')
  const locale = useLocale() === 'ru' ? 'ru' : 'en'
  const topazTools = getLocalizedTopazTools(locale)

  const imageQualityTools = topazTools
    .filter((tool) => tool.runtime === 'image')
    .map((tool) => ({
      icon: getToolIcon(tool),
      title: tool.title,
      description: tool.description,
      href: `/tools/${tool.slug}`,
      badge: tool.status === 'soon' ? (locale === 'ru' ? 'Скоро' : 'Soon') : undefined,
    }))

  const videoTools = topazTools
    .filter((tool) => tool.runtime === 'video')
    .map((tool) => ({
      icon: getToolIcon(tool),
      title: tool.title,
      description: tool.description,
      href: `/tools/${tool.slug}`,
      badge: tool.status === 'soon' ? (locale === 'ru' ? 'Скоро' : 'Soon') : undefined,
    }))

  const categories: Category[] = [
    {
      title: t('catBgTitle'),
      description: t('catBgDesc'),
      tools: [
        { icon: Eraser, title: t('toolRemoveBgTitle'), description: t('toolRemoveBgDesc'), href: '/tools/background-remover' },
        { icon: Square, title: t('toolWhiteBgTitle'), description: t('toolWhiteBgDesc'), href: '/tools/white-background' },
        { icon: Focus, title: t('toolBlurBgTitle'), description: t('toolBlurBgDesc'), href: '/tools/blur-background' },
        { icon: Palette, title: t('toolChangeBgTitle'), description: t('toolChangeBgDesc'), href: '/tools/change-background-color' },
        { icon: ImagePlus, title: t('toolAddBgTitle'), description: t('toolAddBgDesc'), href: '/tools/add-background' },
      ],
    },
    {
      title: t('catAiTitle'),
      description: t('catAiDesc'),
      tools: [
        { icon: Maximize2, title: t('toolUpscaleTitle'), description: t('toolUpscaleDesc'), href: '/tools/photo-enhancer' },
        { icon: LayoutGrid, title: t('toolCardsTitle'), description: t('toolCardsDesc'), href: '/cards' },
      ],
    },
    {
      title: locale === 'ru' ? 'Качество изображений' : 'Image quality',
      description: locale === 'ru'
        ? 'Новые инструменты для резкости, света, шума, апскейла и восстановления.'
        : 'New tools for sharpening, lighting, denoise, upscaling, and restoration.',
      tools: imageQualityTools,
    },
    {
      title: locale === 'ru' ? 'Видео инструменты' : 'Video tools',
      description: locale === 'ru'
        ? 'Отдельные video-страницы уже готовы, а backend-поток запускается поэтапно.'
        : 'Dedicated video pages are ready, with the backend pipeline rolling out in stages.',
      tools: videoTools,
    },
  ]

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
          {categories.map((cat, catIdx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: catIdx * 0.1, ease: EASE }}
            >
              {/* Category header */}
              <div className="mb-8">
                <h2 className="font-serif text-[clamp(1.5rem,3.5vw,2rem)] font-medium text-foreground tracking-tight mb-2">
                  {cat.title}
                </h2>
                <p className="text-muted-foreground text-base max-w-lg">
                  {cat.description}
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
                  <motion.div key={tool.href} variants={cardVariants}>
                    <Link href={tool.href} className="block group">
                        <div className="bg-white border border-cream-200 rounded-2xl p-6 hover:border-rose-gold-200 hover:shadow-card transition-all duration-300 h-full flex gap-5">
                          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center group-hover:from-rose-gold-200 group-hover:to-rose-gold-300 transition-colors duration-300">
                            <tool.icon className="w-5 h-5 text-rose-gold-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-serif text-lg font-medium text-foreground">
                                {tool.title}
                              </h3>
                              {tool.badge && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                                  {tool.badge}
                                </span>
                              )}
                              <ArrowRight className="w-4 h-4 text-rose-gold-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {tool.description}
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
