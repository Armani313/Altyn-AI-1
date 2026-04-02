'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EASE } from '@/lib/motion'

export function BgRemoverCta() {
  const t = useTranslations('bgRemoverPage')

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-rose-gold-50 to-cream-50 border-t border-cream-200">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-foreground mb-5 tracking-tight">
          {t('ctaTitle')}
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          {t('ctaSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow group h-12 px-8"
            >
              {t('ctaBtn')}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>
          <a href="mailto:support@luminify.app">
            <Button
              variant="outline"
              size="lg"
              className="border-cream-300 text-muted-foreground hover:bg-cream-200 hover:text-foreground h-12 px-8"
            >
              {t('ctaContact')}
            </Button>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
