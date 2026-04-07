import { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { APP_URL, getLanguageAlternates, getPublicUrl } from '@/lib/seo'
import { TOPAZ_TOOL_SLUGS } from '@/lib/tools/topaz-tools'

type SitemapRoute = {
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
  localized: boolean
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const publicRoutes: SitemapRoute[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1, localized: true },
    { path: '/about', changeFrequency: 'monthly', priority: 0.65, localized: true },
    { path: '/tools', changeFrequency: 'weekly', priority: 0.8, localized: true },
    { path: '/faq', changeFrequency: 'weekly', priority: 0.7, localized: true },
    { path: '/contacts', changeFrequency: 'monthly', priority: 0.6, localized: true },
    { path: '/tools/background-remover', changeFrequency: 'weekly', priority: 0.75, localized: true },
    { path: '/tools/white-background', changeFrequency: 'weekly', priority: 0.75, localized: true },
    { path: '/tools/blur-background', changeFrequency: 'weekly', priority: 0.75, localized: true },
    { path: '/tools/change-background-color', changeFrequency: 'weekly', priority: 0.75, localized: true },
    { path: '/tools/add-background', changeFrequency: 'weekly', priority: 0.75, localized: true },
    { path: '/tools/photo-enhancer', changeFrequency: 'weekly', priority: 0.8, localized: true },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3, localized: false },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3, localized: false },
  ]

  const topazToolRoutes: SitemapRoute[] = TOPAZ_TOOL_SLUGS.map((slug) => ({
    path: `/tools/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.72,
    localized: true,
  }))

  const allRoutes = [...publicRoutes, ...topazToolRoutes]

  return allRoutes.flatMap((route) => {
    if (!route.localized) {
      return [
        {
          url: `${APP_URL}${route.path}`,
          lastModified,
          changeFrequency: route.changeFrequency,
          priority: route.priority,
        },
      ]
    }

    return routing.locales.map((locale) => ({
      url: getPublicUrl(locale, route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: getLanguageAlternates(route.path),
      },
    }))
  })
}
