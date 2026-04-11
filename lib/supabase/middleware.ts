import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { PROTECTED_ROUTES, AUTH_ROUTES } from '@/lib/config/routes'
import {
  DEVICE_ID_COOKIE,
  DEVICE_ID_COOKIE_OPTIONS,
  generateDeviceId,
} from '@/lib/auth/device-id'

// Non-default locales that appear as a URL prefix (e.g. /ru/login).
// 'en' is the default locale and has no prefix (just /login, /dashboard).
const LOCALE_PREFIXES = ['ru'] as const

function getLocaleInfo(pathname: string) {
  const parts = pathname.split('/').filter(Boolean) // e.g. ['en', 'dashboard']
  const firstPart = parts[0] ?? ''
  const hasPrefix = (LOCALE_PREFIXES as readonly string[]).includes(firstPart)
  return {
    locale: hasPrefix ? firstPart : 'en',
    // Path without locale prefix, e.g. /dashboard
    strippedPath: hasPrefix ? '/' + parts.slice(1).join('/') : pathname,
    // Prefix for redirect URLs, e.g. '/en' or ''
    urlPrefix: hasPrefix ? `/${firstPart}` : '',
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  let deviceId = request.cookies.get(DEVICE_ID_COOKIE)?.value ?? null
  const shouldSetDeviceCookie = !deviceId

  if (!deviceId) {
    deviceId = generateDeviceId()
    request.cookies.set(DEVICE_ID_COOKIE, deviceId)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { strippedPath, urlPrefix } = getLocaleInfo(request.nextUrl.pathname)

  const isProtected = PROTECTED_ROUTES.some((r) => strippedPath.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => strippedPath.startsWith(r))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = `${urlPrefix}/login`
    const response = NextResponse.redirect(url)
    if (shouldSetDeviceCookie && deviceId) {
      response.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_ID_COOKIE_OPTIONS)
    }
    return response
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = `${urlPrefix}/dashboard`
    const response = NextResponse.redirect(url)
    if (shouldSetDeviceCookie && deviceId) {
      response.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_ID_COOKIE_OPTIONS)
    }
    return response
  }

  if (shouldSetDeviceCookie && deviceId) {
    supabaseResponse.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_ID_COOKIE_OPTIONS)
  }

  return supabaseResponse
}
