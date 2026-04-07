import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

const PUBLIC_RATE_LIMIT_COOKIE = 'luminify_public_id'
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/
const IPV6 = /^[0-9a-f:]+$/i

function parseCookieValue(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=')
    if (rawName === name) return decodeURIComponent(rest.join('='))
  }

  return null
}

function normalizeIp(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null

  const candidate = rawValue.trim()
  if (!candidate) return null

  if (IPV4.test(candidate)) return candidate

  const noBrackets = candidate.replace(/^\[|\]$/g, '')
  if (IPV6.test(noBrackets)) return noBrackets

  return null
}

function isTrustedProxyRequest(request: Request): boolean {
  if (process.env.TRUST_PROXY_IP_HEADERS === 'true') return true

  return request.headers.has('cf-ray') || request.headers.has('x-vercel-id')
}

function getTrustedProxyIp(request: Request): string | null {
  if (!isTrustedProxyRequest(request)) return null

  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]
  return normalizeIp(request.headers.get('cf-connecting-ip') ?? forwardedIp)
}

function getUserAgentHash(request: Request): string {
  const userAgent = request.headers.get('user-agent') ?? 'unknown'
  return createHash('sha256').update(userAgent).digest('hex').slice(0, 16)
}

export function getPublicRateLimitIdentity(request: Request): {
  key: string
  cookieIdToSet: string | null
} {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const existingCookieId = parseCookieValue(cookieHeader, PUBLIC_RATE_LIMIT_COOKIE)
  const cookieId =
    existingCookieId && UUID_LIKE.test(existingCookieId)
      ? existingCookieId
      : crypto.randomUUID()

  const trustedIp = getTrustedProxyIp(request)
  if (trustedIp) {
    return {
      // Use the proxy-verified IP as the shared limiter key so clearing cookies
      // or opening an incognito session does not reset expensive public quotas.
      key: `ip:${trustedIp}`,
      cookieIdToSet: existingCookieId ? null : cookieId,
    }
  }

  return {
    key: `client:${cookieId}:ua:${getUserAgentHash(request)}`,
    cookieIdToSet: existingCookieId ? null : cookieId,
  }
}

export function withPublicRateLimitCookie(
  response: NextResponse,
  cookieIdToSet: string | null,
): NextResponse {
  if (!cookieIdToSet) return response

  response.cookies.set(PUBLIC_RATE_LIMIT_COOKIE, cookieIdToSet, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SEC,
  })

  return response
}
