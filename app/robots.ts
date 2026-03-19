import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nuraystudio.kz'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/terms'],
        disallow: [
          '/dashboard',
          '/generate',
          '/history',
          '/library',
          '/cards',
          '/remove-bg',
          '/settings',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
