import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { ChangeBgHero } from '@/components/tools/change-bg-hero'
import { ChangeBgFeatures } from '@/components/tools/change-bg-features'
import { ChangeBgHowTo } from '@/components/tools/change-bg-how-to'
import { BgRemoverTools } from '@/components/tools/bg-remover-tools'
import { ChangeBgFaq } from '@/components/tools/change-bg-faq'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'changeBgPage' })
  const currentLocale = locale === 'ru' ? 'ru' : 'en'

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/tools/change-background-color',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: getSeoKeywords('change-background-color', currentLocale as SeoLocale),
  })
}

export default async function ChangeBackgroundColorPage({
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
        <ChangeBgHero />
        <ChangeBgFeatures />
        <ChangeBgHowTo />
        <BgRemoverTools />
        <ChangeBgFaq />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
