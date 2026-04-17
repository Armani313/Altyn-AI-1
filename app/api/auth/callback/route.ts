import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { claimSignupTrialForUser } from '@/lib/auth/signup-trial'
import {
  DEVICE_ID_COOKIE,
  DEVICE_ID_COOKIE_OPTIONS,
  generateDeviceId,
} from '@/lib/auth/device-id'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  // Use the configured app URL so redirects work behind reverse proxy / Docker
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

  if (code) {
    const cookieStore = await cookies()
    let deviceId = cookieStore.get(DEVICE_ID_COOKIE)?.value ?? null
    let shouldSetDeviceCookie = false

    if (!deviceId) {
      deviceId = generateDeviceId()
      shouldSetDeviceCookie = true
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context — ignore
            }
          },
        },
      }
    )

    const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (type === 'recovery') {
        const response = NextResponse.redirect(`${origin}/reset-password`)
        if (shouldSetDeviceCookie && deviceId) {
          response.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_ID_COOKIE_OPTIONS)
        }
        return response
      }

      let user = exchangeData.user ?? exchangeData.session?.user ?? null

      if (!user) {
        const {
          data: { user: loadedUser },
        } = await supabase.auth.getUser()

        user = loadedUser
      }

      if (user?.email) {
        await claimSignupTrialForUser({
          userId: user.id,
          email: user.email,
          deviceId,
          headerList: request.headers,
        })
      }

      const response = NextResponse.redirect(`${origin}/dashboard`)
      if (shouldSetDeviceCookie && deviceId) {
        response.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_ID_COOKIE_OPTIONS)
      }
      return response
    }
  }

  // If code exchange fails, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
