/**
 * POST /api/checkout
 *
 * Creates a Polar checkout session and returns the URL for embedded checkout.
 * Body: { plan: 'starter' | 'pro' | 'business' } or { pack: 'topup_25' | 'topup_100' | 'topup_250' }
 * Returns: { url: string }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getPolarServerConfigError,
  polar,
  POLAR_CREDIT_PACKS,
  POLAR_PLANS,
  isPolarCreditPackKey,
  isPolarPlanKey,
} from '@/lib/payments/polar'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Rate limit (5 checkout attempts per hour per user) ─────────────────
  const rl = await checkRateLimit('checkout', user.id, 5, 60 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    )
  }

  // ── 3. Validate plan param ────────────────────────────────────────────────
  let body: { plan?: string; pack?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const planKey = body.plan
  const packKey = body.pack

  if (Boolean(planKey) === Boolean(packKey)) {
    return NextResponse.json(
      { error: 'Provide exactly one checkout target: plan or pack.' },
      { status: 400 }
    )
  }

  const target = planKey && isPolarPlanKey(planKey)
    ? {
        kind: 'plan' as const,
        key: planKey,
        productId: POLAR_PLANS[planKey].productId,
      }
    : packKey && isPolarCreditPackKey(packKey)
      ? {
          kind: 'pack' as const,
          key: packKey,
          productId: POLAR_CREDIT_PACKS[packKey].productId,
        }
      : null

  if (!target) {
    return NextResponse.json(
      { error: 'Invalid checkout target.' },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const polarConfigError = getPolarServerConfigError()

  if (polarConfigError) {
    console.error(polarConfigError)
    return NextResponse.json(
      { error: 'Payment service not configured.' },
      { status: 503 }
    )
  }

  if (!target.productId) {
    const envVarName = target.kind === 'plan'
      ? `POLAR_PRODUCT_ID_${target.key.toUpperCase()}`
      : `POLAR_PRODUCT_ID_${target.key.toUpperCase()}`

    console.error(`${envVarName} is not configured`)
    return NextResponse.json(
      { error: 'Payment service not configured.' },
      { status: 503 }
    )
  }

  // ── 4. Create Polar checkout session (embed mode) ─────────────────────────
  try {
    const checkout = await polar.checkouts.create({
      products: [target.productId],
      externalCustomerId: user.id,
      customerEmail:      user.email ?? undefined,
      successUrl:         `${appUrl}/settings/billing?status=success`,
      embedOrigin:        appUrl,
      metadata: {
        billingType: target.kind,
        userId:      user.id,
        ...(target.kind === 'plan' ? { plan: target.key } : { pack: target.key }),
      },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('Polar checkout creation failed:', err)
    return NextResponse.json(
      { error: 'Payment gateway error. Try again later.' },
      { status: 502 }
    )
  }
}
