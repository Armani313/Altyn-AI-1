import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { BgRemoverHero } from '@/components/tools/bg-remover-hero'
import { BgRemoverFeatures } from '@/components/tools/bg-remover-features'
import { BgRemoverStats } from '@/components/tools/bg-remover-stats'
import { BgRemoverHowTo } from '@/components/tools/bg-remover-how-to'
import { BgRemoverTools } from '@/components/tools/bg-remover-tools'
import { BgRemoverFaq } from '@/components/tools/bg-remover-faq'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'bgRemoverPage' })
  const currentLocale = locale === 'ru' ? 'ru' : 'en'

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/tools/background-remover',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: getSeoKeywords('background-remover', currentLocale as SeoLocale),
  })
}

export default async function BackgroundRemoverPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      <main>
        <BgRemoverHero />
        <BgRemoverFeatures />
        <BgRemoverStats />
        <BgRemoverHowTo />
        <BgRemoverTools />
        <BgRemoverFaq />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
