import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'
  const now = new Date().toISOString()

  // Public pages that should be indexed
  const publicRoutes = [
    { path: '',      changeFrequency: 'weekly'  as const, priority: 1.0 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  const locales = ['en', 'ru'] as const
  const defaultLocale = 'en'

  const entries: MetadataRoute.Sitemap = []

  for (const route of publicRoutes) {
    for (const locale of locales) {
      // en is default locale (no prefix), ru gets /ru prefix
      const url = locale === defaultLocale
        ? `${baseUrl}${route.path}`
        : `${baseUrl}/${locale}${route.path}`

      const alternates: Record<string, string> = {
        'x-default': `${baseUrl}${route.path}`,
      }
      for (const alt of locales) {
        alternates[alt] = alt === defaultLocale
          ? `${baseUrl}${route.path}`
          : `${baseUrl}/${alt}${route.path}`
      }

      entries.push({
        url,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages: alternates },
      })
    }
  }

  return entries
}
