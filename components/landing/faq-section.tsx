'use client'

import { useTranslations } from 'next-intl'
import { FaqAccordion } from '@/components/faq/faq-accordion'

export function FaqSection() {
  const t = useTranslations('faq')

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ]

  return (
    <FaqAccordion
      id="faq"
      className="scroll-mt-20 px-6 py-24"
      items={faqs}
      overline={t('overline')}
      title={t('title')}
    />
  )
}
