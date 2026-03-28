'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { EASE } from '@/lib/motion'

export function FaqSection() {
  const t = useTranslations('faq')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ]

  return (
    <section id="faq" className="py-24 px-6 scroll-mt-20">
      <div className="max-w-2xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-rose-gold-500 mb-3">
            {t('overline')}
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-medium text-foreground tracking-tight">
            {t('title')}
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left bg-white border border-cream-200 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 hover:border-rose-gold-200 hover:shadow-soft transition-all duration-200"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-foreground text-sm leading-snug">{faq.q}</span>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cream-100 flex items-center justify-center">
                    {isOpen
                      ? <Minus className="w-3.5 h-3.5 text-rose-gold-600" />
                      : <Plus  className="w-3.5 h-3.5 text-rose-gold-600" />
                    }
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
                      <div className="px-6 pt-3 pb-5 text-sm text-muted-foreground leading-relaxed bg-white border border-t-0 border-cream-200 rounded-b-2xl -mt-2">
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
