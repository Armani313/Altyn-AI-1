import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { claimSignupTrialForUser } from '@/lib/auth/signup-trial'
import {
  DEVICE_ID_COOKIE,
  DEVICE_ID_COOKIE_OPTIONS,
  generateDeviceId,
} from '@/lib/auth/device-id'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  let deviceId = cookieStore.get(DEVICE_ID_COOKIE)?.value ?? null
  let shouldSetDeviceCookie = false

  if (!deviceId) {
    deviceId = generateDeviceId()
    shouldSetDeviceCookie = true
  }

  const result = await claimSignupTrialForUser({
    userId: user.id,
    email: user.email ?? null,
    deviceId,
    headerList: await headers(),
  })

  const response = NextResponse.json({
    ok: true,
    granted: result.granted,
    decision: result.decision,
  })

  if (shouldSetDeviceCookie && deviceId) {
    response.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_ID_COOKIE_OPTIONS)
  }

  return response
}
