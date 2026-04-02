'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { Camera, LayoutGrid, Palette, Users, Layers, ArrowRight } from 'lucide-react'
import { EASE } from '@/lib/motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export function BgRemoverTools() {
  const t = useTranslations('bgRemoverPage')

  const tools = [
    { icon: Camera, title: t('otherTool1Title'), desc: t('otherTool1Desc') },
    { icon: LayoutGrid, title: t('otherTool2Title'), desc: t('otherTool2Desc') },
    { icon: Palette, title: t('otherTool3Title'), desc: t('otherTool3Desc') },
    { icon: Users, title: t('otherTool4Title'), desc: t('otherTool4Desc') },
    { icon: Layers, title: t('otherTool5Title'), desc: t('otherTool5Desc') },
  ]

  return (
    <section className="py-24 px-6 bg-cream-50 border-y border-cream-200">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground tracking-tight mb-3">
            {t('otherToolsTitle')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {t('otherToolsSub')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {tools.map((tool) => (
            <motion.div key={tool.title} variants={cardVariants}>
              <Link href="/dashboard" className="block group">
                <div className="bg-white border border-cream-200 rounded-2xl p-6 hover:border-rose-gold-200 hover:shadow-card transition-all duration-300 h-full">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center mb-4 group-hover:from-rose-gold-200 group-hover:to-rose-gold-300 transition-colors duration-300">
                    <tool.icon className="w-5 h-5 text-rose-gold-700" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-rose-gold-600 transition-colors group"
          >
            {t('seeAllTools')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
