'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Upload, Wand2, Download } from 'lucide-react'
import { EASE } from '@/lib/motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

export function FeaturesSection() {
  const t = useTranslations('features')

  const steps = [
    {
      icon: Upload,
      number: '01',
      title: t('step1Title'),
      description: t('step1Desc'),
      accent: t('step1Accent'),
    },
    {
      icon: Wand2,
      number: '02',
      title: t('step2Title'),
      description: t('step2Desc'),
      accent: t('step2Accent'),
    },
    {
      icon: Download,
      number: '03',
      title: t('step3Title'),
      description: t('step3Desc'),
      accent: t('step3Accent'),
    },
  ]

  return (
    <section id="features" className="py-28 px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
            {t('overline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground mb-4 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            {t('sub')}
          </p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((step) => (
            <motion.div key={step.number} variants={cardVariants}>
              <StepCard {...step} />
            </motion.div>
          ))}
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-sm text-muted-foreground"
        >
          {[t('trust1'), t('trust2'), t('trust3')].map((item) => (
            <span key={item} className="font-medium">{item}</span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function StepCard({
  icon: Icon,
  number,
  title,
  description,
  accent,
}: {
  icon: React.ElementType
  number: string
  title: string
  description: string
  accent: string
}) {
  return (
    <div className="group relative bg-white border border-cream-200 rounded-2xl p-7 hover:border-rose-gold-200 hover:shadow-card transition-all duration-350 overflow-hidden">
      <span
        aria-hidden
        className="absolute top-4 right-5 font-serif text-7xl font-bold text-cream-200 leading-none select-none group-hover:text-rose-gold-100 transition-colors duration-300"
      >
        {number}
      </span>
      <div className="absolute inset-0 bg-gradient-to-br from-rose-gold-50/0 to-rose-gold-100/0 group-hover:from-rose-gold-50/60 group-hover:to-rose-gold-50/20 transition-all duration-300 rounded-2xl" />
      <div className="relative z-10 pr-14">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center mb-5 group-hover:from-rose-gold-200 group-hover:to-rose-gold-300 transition-colors duration-300">
          <Icon className="w-5 h-5 text-rose-gold-700" />
        </div>
        <h3 className="font-serif text-xl font-medium text-foreground mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
        <span className="inline-block text-[11px] font-semibold text-rose-gold-600 bg-rose-gold-50 px-2.5 py-1 rounded-full">
          {accent}
        </span>
      </div>
    </div>
  )
}
