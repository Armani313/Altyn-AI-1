import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Playfair_Display, Inter } from 'next/font/google'
import { routing } from '@/i18n/routing'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

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

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
  const locale = routing.locales.includes(localeCookie as (typeof routing.locales)[number])
    ? localeCookie
    : routing.defaultLocale

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}
