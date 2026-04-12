import { POLAR_PLANS, getPolarServerConfigError } from '@/lib/payments/polar'
import { createServiceClient } from '@/lib/supabase/service'

export interface IntegrityCheckResult {
  name: string
  ok: boolean
  detail?: string
}

export interface IntegrityReport {
  ok: boolean
  checkedAt: string
  checks: IntegrityCheckResult[]
}

function buildResult(name: string, ok: boolean, detail?: string): IntegrityCheckResult {
  return detail ? { name, ok, detail } : { name, ok }
}

export async function runIntegrityChecks(): Promise<IntegrityReport> {
  const checks: IntegrityCheckResult[] = []

  const polarConfigError = getPolarServerConfigError()
  checks.push(buildResult('polar_server_config', !polarConfigError, polarConfigError ?? undefined))

  const missingProductIds = Object.entries(POLAR_PLANS)
    .filter(([, plan]) => !plan.productId.trim())
    .map(([key]) => key)

  checks.push(
    buildResult(
      'polar_product_ids',
      missingProductIds.length === 0,
      missingProductIds.length > 0
        ? `Missing POLAR product IDs for: ${missingProductIds.join(', ')}`
        : undefined
    )
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const appUrlLooksValid = typeof appUrl === 'string' && /^https?:\/\//i.test(appUrl)
  checks.push(
    buildResult(
      'app_url',
      appUrlLooksValid,
      appUrlLooksValid ? undefined : 'NEXT_PUBLIC_APP_URL is missing or invalid'
    )
  )

  let supabase: ReturnType<typeof createServiceClient>
  try {
    supabase = createServiceClient()
    checks.push(buildResult('supabase_service_role', true))
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown Supabase configuration error'
    checks.push(buildResult('supabase_service_role', false, detail))

    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      checks,
    }
  }

  const [profilesSchemaRes, subscriptionsSchemaRes, nullEmailCountRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,email,plan,credits_remaining')
      .limit(1),
    supabase
      .from('subscriptions')
      .select('id,plan,status,amount,currency,kaspi_order_id')
      .limit(1),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .is('email', null),
  ])

  checks.push(
    buildResult(
      'profiles_schema',
      !profilesSchemaRes.error,
      profilesSchemaRes.error?.message
    )
  )

  checks.push(
    buildResult(
      'subscriptions_schema',
      !subscriptionsSchemaRes.error,
      subscriptionsSchemaRes.error?.message
    )
  )

  checks.push(
    buildResult(
      'profiles_email_backfill',
      !nullEmailCountRes.error && (nullEmailCountRes.count ?? 0) === 0,
      nullEmailCountRes.error?.message ??
        ((nullEmailCountRes.count ?? 0) > 0
          ? `Profiles with NULL email: ${nullEmailCountRes.count}`
          : undefined)
    )
  )

  return {
    ok: checks.every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    checks,
  }
}
