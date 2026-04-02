import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { BlurBgHero } from '@/components/tools/blur-bg-hero'
import { BlurBgFeatures } from '@/components/tools/blur-bg-features'
import { BlurBgHowTo } from '@/components/tools/blur-bg-how-to'
import { BgRemoverTools } from '@/components/tools/bg-remover-tools'
import { BlurBgFaq } from '@/components/tools/blur-bg-faq'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blurBgPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function BlurBackgroundPage({
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
        <BlurBgHero />
        <BlurBgFeatures />
        <BlurBgHowTo />
        <BgRemoverTools />
        <BlurBgFaq />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
