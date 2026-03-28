/**
 * POST /api/webhooks/polar
 *
 * Polar webhook handler (Standard Webhooks spec).
 * Uses @polar-sh/sdk validateEvent for typed, verified event parsing.
 *
 * Key events:
 *   order.paid            → activate plan + add credits (one-time or renewal)
 *   subscription.active   → activate subscription plan + add credits
 *   subscription.revoked  → revert to free plan
 *   subscription.canceled → mark as cancelled (still active until period end)
 *
 * Idempotent — safe to receive the same event multiple times.
 * Polar retries up to 10 times on non-2xx responses.
 */

import { NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { createServiceClient } from '@/lib/supabase/service'
import { POLAR_PLANS, isPolarPlanKey } from '@/lib/payments/polar'
import { PLAN_META } from '@/lib/config/plans'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET

  if (!secret) {
    console.error('POLAR_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 503 })
  }

  // ── 1. Read raw body ──────────────────────────────────────────────────────
  const rawBody = await request.text()

  // ── 2. Verify signature + parse typed event ───────────────────────────────
  let event: ReturnType<typeof validateEvent>
  try {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => { headers[key] = value })

    event = validateEvent(rawBody, headers, secret)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn('Polar webhook: invalid signature —', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.error('Polar webhook: parse error —', err)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  console.info(`Polar webhook: type=${event.type}`)

  const supabase = createServiceClient()

  // ── 3. Route events ───────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(supabase, event.data)
        break
      case 'subscription.active':
        await handleSubscriptionActive(supabase, event.data)
        break
      case 'subscription.revoked':
        await handleSubscriptionRevoked(supabase, event.data)
        break
      case 'subscription.canceled':
        await handleSubscriptionCanceled(supabase, event.data)
        break
      default:
        // HIGH-2: warn so unhandled events (e.g. refunds) are visible in logs
        console.warn(`Polar webhook: unhandled event type "${event.type}" — review if action needed`)
    }
  } catch (err) {
    console.error(`Polar webhook: handler error for ${event.type}:`, err)
    // Return 500 so Polar retries delivery
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Event handlers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderPaid(supabase: any, order: any) {
  // MED-2: optional chaining guards against unexpected payload structure
  const userId    = order?.customer?.externalId
  const productId = order?.productId

  if (!userId || typeof userId !== 'string') {
    console.warn(`Polar order.paid: missing/invalid externalId (orderId=${order?.id}) — skipping`)
    return
  }

  const planKey = resolvePlanByProductId(productId ?? undefined)
  if (!planKey) {
    console.warn(`Polar order.paid: unknown product ${productId}`)
    return
  }

  const credits = POLAR_PLANS[planKey].credits

  await supabase
    .from('profiles')
    .update({ plan: planKey, credits_remaining: credits } as never)
    .eq('id', userId)

  console.info(`Polar order.paid: user=${userId} plan=${planKey} credits=${credits}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActive(supabase: any, sub: any) {
  const userId    = sub?.customer?.externalId
  const productId = sub?.productId

  if (!userId || typeof userId !== 'string') {
    console.warn(`Polar subscription.active: missing/invalid externalId (subId=${sub?.id}) — skipping`)
    return
  }

  const planKey = resolvePlanByProductId(productId)
  if (!planKey) {
    console.warn(`Polar subscription.active: unknown product ${productId}`)
    return
  }

  const credits  = POLAR_PLANS[planKey].credits
  const startsAt = sub.currentPeriodStart?.toISOString() ?? new Date().toISOString()
  const endsAt   = sub.currentPeriodEnd?.toISOString()   ?? null

  // Upsert subscription row — reuse kaspi_order_id column for Polar sub ID
  // (column will be renamed in a future migration)
  await supabase
    .from('subscriptions')
    .upsert({
      user_id:        userId,
      plan:           planKey,
      status:         'active',
      starts_at:      startsAt,
      expires_at:     endsAt,
      kaspi_order_id: sub.id,
    } as never, { onConflict: 'kaspi_order_id' })

  await supabase
    .from('profiles')
    .update({ plan: planKey, credits_remaining: credits } as never)
    .eq('id', userId)

  console.info(`Polar subscription.active: user=${userId} plan=${planKey} expires=${endsAt}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionRevoked(supabase: any, sub: any) {
  const userId = sub?.customer?.externalId

  if (!userId || typeof userId !== 'string') {
    console.warn(`Polar subscription.revoked: missing/invalid externalId (subId=${sub?.id}) — skipping`)
    return
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' } as never)
    .eq('kaspi_order_id', sub.id)

  // Check for any remaining active subscription
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasActive = ((activeSubs as any[]) ?? []).length > 0

  if (!hasActive) {
    await supabase
      .from('profiles')
      .update({ plan: 'free', credits_remaining: PLAN_META.free.credits } as never)
      .eq('id', userId)

    console.info(`Polar subscription.revoked: user=${userId} downgraded to free`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(supabase: any, sub: any) {
  // canceled = scheduled to end at period boundary; subscription still active until then
  // We just log it — revoked event will fire when access actually ends
  console.info(
    `Polar subscription.canceled: subId=${sub.id} ` +
    `endsAt=${sub.currentPeriodEnd?.toISOString() ?? 'unknown'}`
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolvePlanByProductId(productId: string | undefined): 'starter' | 'pro' | null {
  if (!productId) return null

  for (const [key, plan] of Object.entries(POLAR_PLANS)) {
    if (plan.productId === productId && isPolarPlanKey(key)) return key
  }

  return null
}
