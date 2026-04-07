import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { AllInOneSection } from '@/components/landing/all-in-one-section'
import { CostSavingsSection } from '@/components/landing/cost-savings-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { MultiDeviceSection } from '@/components/landing/multi-device-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { ToolsShowcaseSection } from '@/components/landing/tools-showcase-section'
import { FaqSection } from '@/components/landing/faq-section'
import { Footer } from '@/components/landing/footer'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const currentLocale = locale === 'ru' ? 'ru' : 'en'

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/',
    title: t('landingTitle'),
    description: t('landingDescription'),
    keywords: getSeoKeywords('landing', currentLocale as SeoLocale),
  })
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      <main>
        <HeroSection />
        <AllInOneSection />
        <CostSavingsSection />
        <PricingSection />
        <MultiDeviceSection />
        <TestimonialsSection />
        <ToolsShowcaseSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}
