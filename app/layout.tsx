import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nuraystudio.kz'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Nurai AI Studio — ИИ-фотографии украшений",
    template: "%s | Nurai AI Studio",
  },
  description:
    "Генерируйте профессиональные лайфстайл-фотографии украшений с помощью ИИ. Замените дорогую фотосъёмку — загрузите фото украшения и получите готовый контент за секунды.",
  keywords: [
    "ИИ фотографии украшений",
    "лайфстайл фото ювелирных украшений",
    "генерация фото украшений ИИ",
    "фотосъёмка украшений онлайн",
    "ювелирный магазин Казахстан",
    "AI фото ювелирных изделий",
    "Nurai AI Studio",
  ],
  authors: [{ name: "Nurai AI Studio" }],
  creator: "Nurai AI Studio",
  publisher: "Nurai AI Studio",
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: APP_URL,
    siteName: "Nurai AI Studio",
    title: "Nurai AI Studio — ИИ-фотографии украшений",
    description:
      "Профессиональные лайфстайл-фото ювелирных украшений с помощью ИИ. Для ювелирных магазинов Казахстана. Без фотографа — результат за секунды.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Nurai AI Studio — ИИ-генерация фото украшений",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nurai AI Studio — ИИ-фотографии украшений",
    description:
      "Профессиональные лайфстайл-фото ювелирных украшений с помощью ИИ. Без фотографа — результат за секунды.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon:  [{ url: '/icon', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
  alternates: {
    canonical: APP_URL,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'Nurai AI Studio',
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/icon`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@nurai.kz',
        contactType: 'customer support',
        availableLanguage: ['Russian', 'Kazakh'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Алматы',
        addressCountry: 'KZ',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#app`,
      name: 'Nurai AI Studio',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: APP_URL,
      description:
        'Генерация профессиональных лайфстайл-фотографий ювелирных украшений с помощью ИИ для ювелирных магазинов Казахстана.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KZT',
        description: '3 бесплатные генерации при регистрации',
      },
      publisher: {
        '@id': `${APP_URL}/#organization`,
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
