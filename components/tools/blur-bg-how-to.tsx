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

export function BlurBgHowTo() {
  const t = useTranslations('blurBgPage')

  const steps = [
    { icon: Upload, number: '01', title: t('step1Title'), desc: t('step1Desc') },
    { icon: Wand2, number: '02', title: t('step2Title'), desc: t('step2Desc') },
    { icon: Download, number: '03', title: t('step3Title'), desc: t('step3Desc') },
  ]

  return (
    <section className="py-24 px-6 bg-cream-50 border-y border-cream-200">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
            {t('howToOverline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground tracking-tight">
            {t('howToTitle')}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid md:grid-cols-3 gap-6"
        >
          {steps.map((step) => (
            <motion.div key={step.number} variants={cardVariants}>
              <div className="group relative bg-white border border-cream-200 rounded-2xl p-7 hover:border-rose-gold-200 hover:shadow-card transition-all duration-300 overflow-hidden">
                <span
                  aria-hidden
                  className="absolute top-4 right-5 font-serif text-7xl font-bold text-cream-200 leading-none select-none group-hover:text-rose-gold-100 transition-colors duration-300"
                >
                  {step.number}
                </span>
                <div className="relative z-10 pr-14">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center mb-5">
                    <step.icon className="w-5 h-5 text-rose-gold-700" />
                  </div>
                  <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
