import { CONTENT_SIGNAL_POLICY } from '@/lib/agent-ready'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const appUrl = new URL(request.url).origin

  const body = [
    '# Luminify robots policy',
    '# Content Signals describe permitted post-access uses of this site’s content.',
    '# search = search indexing and standard search results',
    '# ai-input = real-time AI answer grounding / RAG',
    '# ai-train = model training or fine-tuning',
    '',
    'User-agent: *',
    `Content-Signal: ${CONTENT_SIGNAL_POLICY}`,
    'Allow: /',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /dashboard',
    'Disallow: /generate',
    'Disallow: /history',
    'Disallow: /library',
    'Disallow: /cards',
    'Disallow: /remove-bg',
    'Disallow: /editor',
    'Disallow: /settings',
    'Disallow: /api/',
    '',
    `Sitemap: ${appUrl}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Signal': CONTENT_SIGNAL_POLICY,
    },
  })
}
