import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import '../globals.css'

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Luminify — ИИ-фотографии украшений',
    template: '%s | Luminify',
  },
  description:
    'Генерируйте профессиональные лайфстайл-фотографии украшений с помощью ИИ. Загрузите фото украшения и получите готовый контент за секунды.',
  authors: [{ name: 'Luminify' }],
  creator: 'Luminify',
  publisher: 'Luminify',
  alternates: {
    canonical: APP_URL,
    languages: {
      'en': APP_URL,
      'ru': `${APP_URL}/ru`,
      'x-default': APP_URL,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Luminify',
    locale: 'ru_RU',
    alternateLocale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Luminify — ИИ-фотографии украшений',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luminify — ИИ-фотографии украшений',
    description: 'Генерируйте профессиональные лайфстайл-фотографии украшений с помощью ИИ.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon:  [{ url: new URL('/icon', APP_URL).toString(),       type: 'image/png', sizes: '32x32'  }],
    apple: [{ url: new URL('/apple-icon', APP_URL).toString(), type: 'image/png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
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
        email: 'support@luminify.app',
        contactType: 'customer support',
        availableLanguage: ['Russian', 'English', 'Kazakh'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Almaty',
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
        highPrice: '20',
        offerCount: 3,
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
    <html lang={locale} data-scroll-behavior="smooth" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  )
}
