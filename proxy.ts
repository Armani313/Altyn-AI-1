import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  // 1. Run next-intl middleware (locale detection + redirect)
  const intlResponse = intlMiddleware(request)

  // If next-intl is redirecting (e.g., /en → /en/ or locale normalisation),
  // pass it through — no need to run Supabase auth on a redirect response.
  if (intlResponse.status !== 200) return intlResponse

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

  return authResponse
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and API routes.
    // API routes don't need locale handling and have their own auth checks.
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|manifest\\.webmanifest|sitemap\\.xml|robots\\.txt|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|woff2?)$).*)',
  ],
}
