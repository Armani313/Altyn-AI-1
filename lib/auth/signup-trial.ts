import 'server-only'

import { createHash } from 'crypto'
import { cookies, headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { DEVICE_ID_COOKIE } from '@/lib/auth/device-id'

type ClaimSignupTrialParams = {
  userId: string
  email: string | null
  deviceId?: string | null
  headerList?: Headers
}

type ClaimSignupTrialResult = {
  granted: boolean
  decision: 'granted' | 'blocked' | 'legacy' | 'pending' | 'skipped'
  creditsRemaining: number | null
  reason: string | null
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeEmail(email: string) {
  const lower = email.trim().toLowerCase()
  const [rawLocal = '', rawDomain = ''] = lower.split('@')

  if (!rawLocal || !rawDomain) {
    return {
      normalized: lower,
      domain: rawDomain || null,
    }
  }

  let local = rawLocal
  let domain = rawDomain

  if (domain === 'googlemail.com') {
    domain = 'gmail.com'
  }

  if (domain === 'gmail.com') {
    local = local.split('+')[0].replace(/\./g, '')
  }

  return {
    normalized: `${local}@${domain}`,
    domain,
  }
}

function extractClientIp(headerList: Headers) {
  const forwardedFor = headerList.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null
  }

  return headerList.get('x-real-ip')?.trim() || null
}

function normalizeIp(ip: string) {
  return ip.replace(/^::ffff:/, '').trim()
}

function extractSubnet(ip: string | null) {
  if (!ip) return null

  const normalized = normalizeIp(ip)

  if (normalized.includes('.')) {
    const parts = normalized.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
    }
    return null
  }

  if (normalized.includes(':')) {
    const parts = normalized.split(':').filter(Boolean)
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::/64`
    }
  }

  return null
}

export async function claimSignupTrialForUser({
  userId,
  email,
  deviceId,
  headerList,
}: ClaimSignupTrialParams): Promise<ClaimSignupTrialResult> {
  if (!userId || !email) {
    return {
      granted: false,
      decision: 'skipped',
      creditsRemaining: null,
      reason: 'missing_identity',
    }
  }

  const cookieStore = await cookies()
  const effectiveDeviceId = deviceId ?? cookieStore.get(DEVICE_ID_COOKIE)?.value ?? null

  if (!effectiveDeviceId) {
    return {
      granted: false,
      decision: 'skipped',
      creditsRemaining: null,
      reason: 'missing_device',
    }
  }

  const effectiveHeaders = headerList ?? await headers()
  const ip = extractClientIp(effectiveHeaders)
  const subnet = extractSubnet(ip)
  const userAgent = effectiveHeaders.get('user-agent')?.trim() || null
  const normalizedEmail = normalizeEmail(email)
  const serviceSupabase = createServiceClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (serviceSupabase as any).rpc('claim_signup_trial', {
      p_user_id: userId,
      p_email_normalized: normalizedEmail.normalized,
      p_email_domain: normalizedEmail.domain,
      p_device_hash: sha256(`device:${effectiveDeviceId}`),
      p_ip_hash: ip ? sha256(`ip:${normalizeIp(ip)}`) : null,
      p_subnet_hash: subnet ? sha256(`subnet:${subnet}`) : null,
      p_ua_hash: userAgent ? sha256(`ua:${userAgent}`) : null,
    })

    if (error) {
      console.error('[SignupTrial] Failed to claim trial:', error)
      return {
        granted: false,
        decision: 'skipped',
        creditsRemaining: null,
        reason: 'rpc_error',
      }
    }

    const row = Array.isArray(data) ? data[0] : data

    return {
      granted: Boolean(row?.granted),
      decision: (row?.decision ?? 'skipped') as ClaimSignupTrialResult['decision'],
      creditsRemaining: typeof row?.credits_remaining === 'number' ? row.credits_remaining : null,
      reason: typeof row?.reason === 'string' ? row.reason : null,
    }
  } catch (error) {
    console.error('[SignupTrial] Unexpected claim error:', error)
    return {
      granted: false,
      decision: 'skipped',
      creditsRemaining: null,
      reason: 'unexpected_error',
    }
  }
}
