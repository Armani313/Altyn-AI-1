'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Download, Maximize2, Upload } from 'lucide-react'
import { EASE } from '@/lib/motion'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

export function UpscaleHowTo() {
  const t = useTranslations('upscalePage')

  const steps = [
    { icon: Upload, number: '01', title: t('step1Title'), desc: t('step1Desc') },
    { icon: Maximize2, number: '02', title: t('step2Title'), desc: t('step2Desc') },
    { icon: Download, number: '03', title: t('step3Title'), desc: t('step3Desc') },
  ]

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, ease: EASE }}
          className="mb-14 text-center"
        >
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
            {t('howToOverline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-tight text-foreground">
            {t('howToTitle')}
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-6 md:grid-cols-3"
        >
          {steps.map((step) => (
            <motion.div key={step.number} variants={cardVariants}>
              <div className="group relative overflow-hidden rounded-2xl border border-cream-200 bg-white p-7 transition-all duration-300 hover:border-rose-gold-200 hover:shadow-card">
                <span className="absolute right-5 top-4 select-none font-serif text-7xl font-bold leading-none text-cream-200 transition-colors duration-300 group-hover:text-rose-gold-100">
                  {step.number}
                </span>
                <div className="relative z-10 pr-14">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-gold-100 to-rose-gold-200">
                    <step.icon className="h-5 w-5 text-rose-gold-700" />
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-medium text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
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
