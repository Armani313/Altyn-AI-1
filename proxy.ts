import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)
const isDev = process.env.NODE_ENV === 'development'
const devLocalImgSrc = 'http://localhost:3000 http://127.0.0.1:3000'
const devLocalConnectSrc = 'ws://localhost:3000 ws://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:3000'

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://static.cloudflareinsights.com"
      : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://www.googletagmanager.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com${isDev ? ` ${devLocalImgSrc}` : ''}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com${isDev ? ` ${devLocalConnectSrc}` : ''}`,
    "frame-src https://polar.sh https://*.polar.sh",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function applySecurityHeaders(response: Response) {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy())
}

export async function proxy(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection + redirect)
  const intlResponse = intlMiddleware(request)

  // If next-intl is redirecting (e.g., /en → /en/ or locale normalisation),
  // pass it through — no need to run Supabase auth on a redirect response.
  if (intlResponse.status !== 200) {
    applySecurityHeaders(intlResponse)
    return intlResponse
  }

  // 2. Run Supabase session refresh + auth-based route protection.
  const authResponse = await updateSession(request)

  // 3. Merge next-intl routing headers (x-middleware-rewrite, x-next-intl-locale)
  // into the auth response. Without this, the NextResponse.next() created by
  // updateSession overwrites the intl rewrite and Next.js routes to app/page.tsx
  // instead of app/[locale]/page.tsx for the default locale.
  if (authResponse.status === 200) {
    intlResponse.headers.forEach((value, key) => {
      // set-cookie must be appended (not set) so that the locale cookie
      // written by next-intl doesn't overwrite Supabase session cookies.
      if (key.toLowerCase() === 'set-cookie') {
        authResponse.headers.append(key, value)
      } else {
        authResponse.headers.set(key, value)
      }
    })
  }

  applySecurityHeaders(authResponse)

  return authResponse
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and API routes.
    // API routes don't need locale handling and have their own auth checks.
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|woff2?)$).*)',
  ],
}
