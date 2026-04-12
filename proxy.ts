import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)
const isDev = process.env.NODE_ENV === 'development'
const devLocalImgSrc = 'http://localhost:3000 http://127.0.0.1:3000'
const devLocalConnectSrc = 'ws://localhost:3000 ws://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:3000'
const ONNX_PAGES = new Set([
  '/editor',
  '/remove-bg',
  '/tools/background-remover',
  '/tools/white-background',
  '/tools/blur-background',
  '/tools/change-background-color',
  '/tools/add-background',
])

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/^\/(?:ru|en)(?=\/|$)/, '')
  return normalized === '' ? '/' : normalized
}

function buildContentSecurityPolicy(pathname: string) {
  const isOnnxPage = ONNX_PAGES.has(normalizePathname(pathname))

  if (isOnnxPage) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: https://*.supabase.co${isDev ? ` ${devLocalImgSrc}` : ''}`,
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://staticimgly.com${isDev ? ` ${devLocalConnectSrc}` : ''}`,
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  }

  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://static.cloudflareinsights.com"
      : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://www.googletagmanager.com https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com${isDev ? ` ${devLocalImgSrc}` : ''}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://staticimgly.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com${isDev ? ` ${devLocalConnectSrc}` : ''}`,
    "frame-src https://polar.sh https://*.polar.sh",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function applySecurityHeaders(pathname: string, response: Response) {
  const normalizedPathname = normalizePathname(pathname)
  const isOnnxPage = ONNX_PAGES.has(normalizedPathname)

  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(pathname))

  if (isOnnxPage) {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  } else {
    response.headers.delete('Cross-Origin-Opener-Policy')
    response.headers.delete('Cross-Origin-Embedder-Policy')
  }
}

export async function proxy(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection + redirect)
  const intlResponse = intlMiddleware(request)

  // If next-intl is redirecting (e.g., /en → /en/ or locale normalisation),
  // pass it through — no need to run Supabase auth on a redirect response.
  if (intlResponse.status !== 200) {
    applySecurityHeaders(request.nextUrl.pathname, intlResponse)
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

  applySecurityHeaders(request.nextUrl.pathname, authResponse)

  return authResponse
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and API routes.
    // API routes don't need locale handling and have their own auth checks.
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|woff2?)$).*)',
  ],
}
