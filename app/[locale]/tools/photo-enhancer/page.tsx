import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Footer } from '@/components/landing/footer'
import { Navbar } from '@/components/landing/navbar'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { BgRemoverTools } from '@/components/tools/bg-remover-tools'
import { UpscaleFaq } from '@/components/tools/upscale-faq'
import { UpscaleFeatures } from '@/components/tools/upscale-features'
import { UpscaleHero } from '@/components/tools/upscale-hero'
import { UpscaleHowTo } from '@/components/tools/upscale-how-to'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'upscalePage' })
  const currentLocale = locale === 'ru' ? 'ru' : 'en'

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/tools/photo-enhancer',
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: getSeoKeywords('photo-enhancer', currentLocale as SeoLocale),
  })
}

export default async function PhotoEnhancerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ image?: string | string[] }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const initialImageUrl = Array.isArray(resolvedSearchParams.image)
    ? resolvedSearchParams.image[0] ?? null
    : resolvedSearchParams.image ?? null
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      <main>
        <UpscaleHero initialImageUrl={initialImageUrl} />
        <UpscaleFeatures />
        <UpscaleHowTo />
        <BgRemoverTools />
        <UpscaleFaq />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
