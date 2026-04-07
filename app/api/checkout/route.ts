/**
 * POST /api/checkout
 *
 * Creates a Polar checkout session and returns the URL for embedded checkout.
 * Body: { plan: 'starter' | 'pro' | 'business' }
 * Returns: { url: string }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { polar, POLAR_PLANS, isPolarPlanKey, getPolarServerConfigError } from '@/lib/payments/polar'
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
  let body: { plan?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const planKey = body.plan

  if (!planKey || !isPolarPlanKey(planKey)) {
    return NextResponse.json(
      { error: 'Invalid plan. Available: starter, pro, business.' },
      { status: 400 }
    )
  }

  const plan   = POLAR_PLANS[planKey]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const polarConfigError = getPolarServerConfigError()

  if (polarConfigError) {
    console.error(polarConfigError)
    return NextResponse.json(
      { error: 'Payment service not configured.' },
      { status: 503 }
    )
  }

  if (!plan.productId) {
    console.error(`POLAR_PRODUCT_ID_${planKey.toUpperCase()} is not configured`)
    return NextResponse.json(
      { error: 'Payment service not configured.' },
      { status: 503 }
    )
  }

  // ── 4. Create Polar checkout session (embed mode) ─────────────────────────
  try {
    const checkout = await polar.checkouts.create({
      products: [plan.productId],
      externalCustomerId: user.id,
      customerEmail:      user.email ?? undefined,
      successUrl:         `${appUrl}/settings/billing?status=success`,
      embedOrigin:        appUrl,
      metadata: {
        plan:   planKey,
        userId: user.id,
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
