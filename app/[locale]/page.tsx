import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { HeroSection } from '@/components/landing/hero-section'
import { CategoriesSection } from '@/components/landing/categories-section'
import { AllInOneSection } from '@/components/landing/all-in-one-section'
import { CostSavingsSection } from '@/components/landing/cost-savings-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { MultiDeviceSection } from '@/components/landing/multi-device-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { ToolsShowcaseSection } from '@/components/landing/tools-showcase-section'
import { FaqSection } from '@/components/landing/faq-section'
import { Footer } from '@/components/landing/footer'
import {
  APP_URL,
  buildLocalizedMetadata,
  getPublicUrl,
  getSeoKeywords,
  type SeoLocale,
} from '@/lib/seo'

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
  const currentLocale: SeoLocale = locale === 'ru' ? 'ru' : 'en'

  const t = await getTranslations({ locale, namespace: 'metadata' })
  const tFaq = await getTranslations({ locale, namespace: 'faq' })

  const url = getPublicUrl(currentLocale, '/')

  const softwareAppLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Luminify',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'AI Product Photography',
    operatingSystem: 'Web',
    url,
    description: t('landingDescription'),
    image: `${APP_URL}/opengraph-image`,
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'DTC e-commerce brands (apparel, cosmetics, jewelry)',
      geographicArea: {
        '@type': 'Country',
        name: 'United States',
      },
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
        description: '3 generations on signup, no credit card required',
      },
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '1',
        priceCurrency: 'USD',
        description: '10 generations per month',
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '10',
        priceCurrency: 'USD',
        description: '100 generations per month',
      },
      {
        '@type': 'Offer',
        name: 'Business',
        price: '25',
        priceCurrency: 'USD',
        description: '250 generations per month',
      },
    ],
    featureList: [
      'On-model lifestyle photo generation',
      'Ghost-mannequin to on-model conversion for apparel',
      'Category-specific pose templates (apparel, cosmetics, jewelry)',
      'Automatic background removal',
      'Marketplace product card composer',
      'Photo editor and Topaz-powered upscaler',
      'Short-form video generation',
    ],
  }

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Luminify',
    url: APP_URL,
    logo: `${APP_URL}/icon`,
    description: t('description'),
    sameAs: [] as string[],
    areaServed: {
      '@type': 'Country',
      name: 'United States',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@luminify.app',
      availableLanguage: ['English', 'Russian'],
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [1, 2, 3, 4, 5, 6].map((i) => ({
      '@type': 'Question',
      name: tFaq(`q${i}` as 'q1'),
      acceptedAnswer: {
        '@type': 'Answer',
        text: tFaq(`a${i}` as 'a1'),
      },
    })),
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <AllInOneSection />
        <CostSavingsSection />
        <PricingSection />
        <ToolsShowcaseSection />
        <MultiDeviceSection />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  )
}
