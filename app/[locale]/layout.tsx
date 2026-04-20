import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { AmplitudeAnalytics } from '@/components/analytics/amplitude-analytics'
import { ConditionalGoogleAnalytics } from '@/components/analytics/conditional-google-analytics'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

interface MetadataCopy {
  defaultTitle: string
  titleTemplate: string
  description: string
}

async function loadMetadataCopy(locale: 'ru' | 'en'): Promise<MetadataCopy> {
  if (locale === 'ru') {
    return (await import('@/messages/ru.json')).default.metadata as MetadataCopy
  }

  return (await import('@/messages/en.json')).default.metadata as MetadataCopy
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  const copy = await loadMetadataCopy(currentLocale)

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: copy.defaultTitle,
      template: copy.titleTemplate,
    },
    description: copy.description,
    authors: [{ name: 'Luminify' }],
    creator: 'Luminify',
    publisher: 'Luminify',
    alternates: {
      canonical: currentLocale === 'ru' ? `${APP_URL}/ru` : APP_URL,
      languages: {
        en: APP_URL,
        ru: `${APP_URL}/ru`,
        'x-default': APP_URL,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Luminify',
      locale: currentLocale === 'ru' ? 'ru_RU' : 'en_US',
      alternateLocale: currentLocale === 'ru' ? 'en_US' : 'ru_RU',
      title: copy.defaultTitle,
      description: copy.description,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: copy.defaultTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.defaultTitle,
      description: copy.description,
      images: ['/opengraph-image'],
    },
    icons: {
      icon: [{ url: new URL('/icon', APP_URL).toString(), type: 'image/png', sizes: '32x32' }],
      apple: [{ url: new URL('/apple-icon', APP_URL).toString(), type: 'image/png', sizes: '180x180' }],
    },
    manifest: '/manifest.webmanifest',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#C4834F',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'Luminify',
      url: APP_URL,
      logo: { '@type': 'ImageObject', url: `${APP_URL}/icon` },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'arman@luminify.app',
        contactType: 'customer support',
        availableLanguage: ['Russian', 'English', 'Kazakh'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Astana',
        addressCountry: 'KZ',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#app`,
      name: 'Luminify',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: APP_URL,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '25',
        offerCount: 4,
      },
      publisher: { '@id': `${APP_URL}/#organization` },
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'Luminify',
      publisher: { '@id': `${APP_URL}/#organization` },
    },
  ],
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  // Load messages for the current locale
  const messages = await getMessages()

  return (
    <>
      <Script
        id="luminify-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
      <AmplitudeAnalytics />
      {process.env.NEXT_PUBLIC_GA_ID && (
        <ConditionalGoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </>
  )
}
