import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { WhiteBgHero } from '@/components/tools/white-bg-hero'
import { WhiteBgFeatures } from '@/components/tools/white-bg-features'
import { WhiteBgHowTo } from '@/components/tools/white-bg-how-to'
import { BgRemoverTools } from '@/components/tools/bg-remover-tools'
import { WhiteBgFaq } from '@/components/tools/white-bg-faq'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'whiteBgPage' })
  const currentLocale = locale === 'ru' ? 'ru' : 'en'

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/tools/white-background',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: getSeoKeywords('white-background', currentLocale as SeoLocale),
  })
}

export default async function WhiteBackgroundPage({
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
        <WhiteBgHero />
        <WhiteBgFeatures />
        <WhiteBgHowTo />
        <BgRemoverTools />
        <WhiteBgFaq />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
