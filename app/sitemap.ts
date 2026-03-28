import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date('2026-03-25'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
