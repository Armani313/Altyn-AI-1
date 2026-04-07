'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { EASE } from '@/lib/motion'

export function UpscaleFaq() {
  const t = useTranslations('upscalePage')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
    { q: t('faqQ4'), a: t('faqA4') },
    { q: t('faqQ5'), a: t('faqA5') },
  ]

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 text-center"
        >
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500">
            FAQ
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-tight text-foreground">
            {t('faqTitle')}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl border border-cream-200 bg-white px-6 py-5 text-left transition-all duration-200 hover:border-rose-gold-200 hover:shadow-soft"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium leading-snug text-foreground">{faq.q}</span>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cream-100">
                    {isOpen ? (
                      <Minus className="h-3.5 w-3.5 text-rose-gold-600" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-rose-gold-600" />
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="-mt-2 rounded-b-2xl border border-t-0 border-cream-200 bg-white px-6 pb-5 pt-3 text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
