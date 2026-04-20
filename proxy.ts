import { NextResponse, type NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'
import { CONTENT_SIGNAL_POLICY, getAgentDiscoveryLinkHeader } from '@/lib/agent-ready'
import { updateSession } from '@/lib/supabase/middleware'

const isDev = process.env.NODE_ENV === 'development'
const devLocalImgSrc = 'http://localhost:3000 http://127.0.0.1:3000'
const devLocalConnectSrc = 'ws://localhost:3000 ws://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:3000'
const AGENT_MARKDOWN_LOCALE_PARAM = '__agent_markdown_locale'
const INTERNAL_LOCALE_REWRITE_HEADER = 'x-luminify-locale-rewrite'
const localeCookieConfig = typeof routing.localeCookie === 'object' ? routing.localeCookie : null
const LOCALE_COOKIE_NAME = localeCookieConfig?.name ?? 'NEXT_LOCALE'
const LOCALE_COOKIE_MAX_AGE = localeCookieConfig?.maxAge ?? 60 * 60 * 24 * 365
const DEFAULT_LOCALE = routing.defaultLocale
const NON_DEFAULT_LOCALES = routing.locales.filter((locale) => locale !== DEFAULT_LOCALE)

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

function appendHeader(response: Response, name: string, value: string) {
  const existing = response.headers.get(name)
  response.headers.set(name, existing ? `${existing}, ${value}` : value)
}

function copySetCookieHeader(from: Response, to: Response) {
  const setCookie = from.headers.get('set-cookie')
  if (setCookie) {
    to.headers.set('set-cookie', setCookie)
  }
}

function setLocaleCookie(response: NextResponse, locale: (typeof routing.locales)[number]) {
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
}

function requestPrefersMarkdown(request: NextRequest) {
  const accept = request.headers.get('accept') ?? ''

  if (request.headers.get('x-agent-markdown-source') === '1') {
    return false
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }

  return accept.includes('text/markdown')
}

function applyResponseHeaders(response: Response, origin: string) {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy())
  response.headers.set('Content-Signal', CONTENT_SIGNAL_POLICY)
  appendHeader(response, 'Link', getAgentDiscoveryLinkHeader(origin))
  appendHeader(response, 'Vary', 'Accept')
}

function getPathLocale(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (routing.locales.includes(firstSegment as (typeof routing.locales)[number])) {
    return firstSegment as (typeof routing.locales)[number]
  }

  return null
}

function stripLocalePrefix(pathname: string, locale: (typeof routing.locales)[number]) {
  if (pathname === `/${locale}`) {
    return '/'
  }

  return pathname.startsWith(`/${locale}/`) ? pathname.slice(locale.length + 1) : pathname
}

function getPreferredLocale(request: NextRequest) {
  const localeCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value

  if (routing.locales.includes(localeCookie as (typeof routing.locales)[number])) {
    return localeCookie as (typeof routing.locales)[number]
  }

  const acceptLanguage = request.headers.get('accept-language')?.toLowerCase() ?? ''

  if (acceptLanguage.includes('ru')) {
    return 'ru' as const
  }

  return DEFAULT_LOCALE
}

function buildPrefixedPath(pathname: string, locale: (typeof routing.locales)[number]) {
  if (locale === DEFAULT_LOCALE) {
    return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
  }

  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
}

export async function proxy(request: NextRequest) {
  const isMarkdownSourceRequest = request.headers.get('x-agent-markdown-source') === '1'
  const isMarkdownLocaleRequest =
    request.nextUrl.searchParams.get(AGENT_MARKDOWN_LOCALE_PARAM) === '1'
  const isInternalLocaleRewrite = request.headers.get(INTERNAL_LOCALE_REWRITE_HEADER) === '1'

  if (isMarkdownLocaleRequest || isInternalLocaleRewrite) {
    const passthroughResponse = NextResponse.next({ request })
    applyResponseHeaders(passthroughResponse, request.nextUrl.origin)
    return passthroughResponse
  }

  const pathLocale = getPathLocale(request.nextUrl.pathname)
  const preferredLocale = pathLocale ?? getPreferredLocale(request)

  if (pathLocale === DEFAULT_LOCALE) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = stripLocalePrefix(request.nextUrl.pathname, DEFAULT_LOCALE)

    const redirectResponse = NextResponse.redirect(redirectUrl)
    setLocaleCookie(redirectResponse, DEFAULT_LOCALE)
    applyResponseHeaders(redirectResponse, request.nextUrl.origin)
    return redirectResponse
  }

  if (!pathLocale && preferredLocale !== DEFAULT_LOCALE) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = buildPrefixedPath(request.nextUrl.pathname, preferredLocale)

    const redirectResponse = NextResponse.redirect(redirectUrl)
    setLocaleCookie(redirectResponse, preferredLocale)
    applyResponseHeaders(redirectResponse, request.nextUrl.origin)
    return redirectResponse
  }

  const authResponse = await updateSession(request)
  const effectiveLocale = pathLocale ?? preferredLocale

  if (authResponse.status !== 200) {
    setLocaleCookie(authResponse, effectiveLocale)
    applyResponseHeaders(authResponse, request.nextUrl.origin)
    return authResponse
  }

  if (!isMarkdownSourceRequest && requestPrefersMarkdown(request)) {
    const markdownUrl = request.nextUrl.clone()
    markdownUrl.pathname = '/api/agent-markdown'
    markdownUrl.search = ''
    markdownUrl.searchParams.set('path', `${request.nextUrl.pathname}${request.nextUrl.search}`)

    const rewriteResponse = NextResponse.rewrite(markdownUrl)
    copySetCookieHeader(authResponse, rewriteResponse)
    setLocaleCookie(rewriteResponse, effectiveLocale)

    applyResponseHeaders(rewriteResponse, request.nextUrl.origin)
    return rewriteResponse
  }

  if (!pathLocale) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = buildPrefixedPath(request.nextUrl.pathname, effectiveLocale)

    if (isMarkdownSourceRequest) {
      rewriteUrl.searchParams.set(AGENT_MARKDOWN_LOCALE_PARAM, '1')
      const rewriteResponse = NextResponse.rewrite(rewriteUrl)
      copySetCookieHeader(authResponse, rewriteResponse)
      setLocaleCookie(rewriteResponse, effectiveLocale)
      applyResponseHeaders(rewriteResponse, request.nextUrl.origin)
      return rewriteResponse
    }

    const rewriteHeaders = new Headers(request.headers)
    rewriteHeaders.set(INTERNAL_LOCALE_REWRITE_HEADER, '1')

    const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: rewriteHeaders,
      },
    })

    copySetCookieHeader(authResponse, rewriteResponse)
    setLocaleCookie(rewriteResponse, effectiveLocale)
    applyResponseHeaders(rewriteResponse, request.nextUrl.origin)
    return rewriteResponse
  }

  if (NON_DEFAULT_LOCALES.includes(pathLocale)) {
    setLocaleCookie(authResponse, pathLocale)
  } else {
    setLocaleCookie(authResponse, effectiveLocale)
  }

  applyResponseHeaders(authResponse, request.nextUrl.origin)

  return authResponse
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and API routes.
    // API routes don't need locale handling and have their own auth checks.
    '/((?!_next/static|_next/image|\\.well-known(?:/.*)?|favicon.ico|icon|apple-icon|opengraph-image|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|llms\\.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|woff2?)$).*)',
  ],
}
