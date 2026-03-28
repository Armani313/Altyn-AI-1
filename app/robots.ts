import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

  const disallowedPaths = [
    '/login',
    '/register',
    '/dashboard',
    '/generate',
    '/history',
    '/library',
    '/cards',
    '/remove-bg',
    '/settings',
    '/api/',
  ]

  return {
    rules: [
      // General crawlers
      {
        userAgent: '*',
        allow: ['/', '/terms'],
        disallow: disallowedPaths,
      },
      // AI search & LLM crawlers — explicitly allow public pages
      { userAgent: 'GPTBot',          allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'ChatGPT-User',    allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'anthropic-ai',    allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'ClaudeBot',       allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'PerplexityBot',   allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'Google-Extended', allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'Googlebot',       allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'cohere-ai',       allow: ['/', '/terms', '/llms.txt'] },
      { userAgent: 'meta-externalagent', allow: ['/', '/terms', '/llms.txt'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
