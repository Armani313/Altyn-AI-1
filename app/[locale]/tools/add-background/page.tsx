import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { AddBgHero } from '@/components/tools/add-bg-hero'
import { AddBgFeatures } from '@/components/tools/add-bg-features'
import { AddBgHowTo } from '@/components/tools/add-bg-how-to'
import { BgRemoverTools } from '@/components/tools/bg-remover-tools'
import { AddBgFaq } from '@/components/tools/add-bg-faq'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'addBgPage' })
  const currentLocale = locale === 'ru' ? 'ru' : 'en'

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/tools/add-background',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: getSeoKeywords('add-background', currentLocale as SeoLocale),
  })
}

export default async function AddBackgroundPage({
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
        <AddBgHero />
        <AddBgFeatures />
        <AddBgHowTo />
        <BgRemoverTools />
        <AddBgFaq />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
