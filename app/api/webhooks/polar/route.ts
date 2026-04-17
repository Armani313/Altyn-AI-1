/**
 * POST /api/webhooks/polar
 *
 * Polar webhook handler (Standard Webhooks spec).
 * Uses @polar-sh/sdk validateEvent for typed, verified event parsing.
 *
 * Key events:
 *   order.paid            → activate subscription plan OR add one-time top-up credits
 *   order.refunded        → log + mark subscription cancelled (credits not clawed)
 *   subscription.active   → activate subscription plan + add credits
 *   subscription.revoked  → revert to free plan
 *   subscription.canceled → set cancel_at_period_end=true (still active until period end)
 *
 * Credit writes flow through the `set_subscription_credits` RPC (migration 021)
 * so every plan transition produces a row in `credit_transactions` for audit.
 *
 * Idempotent — safe to receive the same event multiple times.
 *
 * Failure policy: any resolution failure (missing userId, unknown productId,
 * DB error) is thrown so the outer catch returns 500 and Polar retries
 * delivery up to 10 times. Never silently 200 — silent returns are how we
 * ended up with paid-but-not-activated customers twice in a row.
 */

import { NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import { createServiceClient } from '@/lib/supabase/service'
import {
  POLAR_CREDIT_PACKS,
  POLAR_PLANS,
  isPolarCreditPackKey,
  isPolarPlanKey,
} from '@/lib/payments/polar'
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

  // Rich initial log for diagnosing lost events — includes event id, resolved
  // userId (if any) and incoming productId. Lets us grep prod logs without a
  // DB dive when the next customer reports "plan not updated".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = event.data as any
  const incomingProductId = data?.productId ?? data?.product?.id ?? null
  console.info(
    `Polar webhook: type=${event.type} id=${data?.id ?? 'unknown'} ` +
    `userId=${resolveUserId(data) ?? 'unresolved'} ` +
    `productId=${incomingProductId ?? 'none'}`
  )

  const supabase = createServiceClient()

  // ── 3. Route events ───────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'order.paid':
        await handleOrderPaid(supabase, event.data)
        break
      case 'order.refunded':
        await handleOrderRefunded(supabase, event.data)
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
        // HIGH-2: warn so unhandled events are visible in logs
        console.warn(`Polar webhook: unhandled event type "${event.type}" — review if action needed`)
    }
  } catch (err) {
    console.error(`Polar webhook: handler error for ${event.type}:`, err)
    // Return 500 so Polar retries delivery (up to 10 times)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Event handlers ────────────────────────────────────────────────────────────

function assertSupabaseSuccess(
  context: string,
  result: { error: { message?: string } | null }
) {
  if (result.error) {
    throw new Error(`${context}: ${result.error.message ?? 'Unknown Supabase error'}`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderPaid(supabase: any, order: any) {
  // Resolve userId: prefer customer.externalId, fallback to checkout metadata.
  // Throw on miss so Polar retries — silent 200 here caused two real incidents.
  const userId = resolveUserId(order)

  if (!userId) {
    throw new Error(
      `Polar order.paid: cannot resolve userId (orderId=${order?.id}, ` +
      `customer.externalId=${order?.customer?.externalId}, ` +
      `metadata.userId=${order?.metadata?.userId})`
    )
  }

  // Resolve productId: prefer order.productId, fallback to order.product.id
  const productId = order?.productId ?? order?.product?.id
  const product = resolveBillingProductByProductId(productId ?? undefined)
  if (!product) {
    throw new Error(
      `Polar order.paid: unknown product (orderId=${order?.id}, ` +
      `productId=${order?.productId}, product.id=${order?.product?.id}) — ` +
      `check POLAR_PRODUCT_ID_* env vars match Polar dashboard`
    )
  }

  if (product.kind === 'pack') {
    await callGrantTopupCredits(supabase, {
      userId,
      credits: product.credits,
      refId: typeof order?.id === 'string' ? order.id : null,
      packKey: product.key,
      context: 'Polar order.paid topup',
    })

    console.info(`Polar order.paid: user=${userId} topup=${product.key} credits=${product.credits}`)
    return
  }

  const planKey = product.key
  const credits = product.credits

  const subscriptionId = order?.subscription?.id
  const startsAt = order?.subscription?.currentPeriodStart?.toISOString?.() ?? null
  const endsAt = order?.subscription?.currentPeriodEnd?.toISOString?.() ?? null

  if (subscriptionId && typeof subscriptionId === 'string') {
    const subWrite = await supabase
      .from('subscriptions')
      .upsert({
        user_id:               userId,
        plan:                  planKey,
        status:                'active',
        starts_at:             startsAt,
        expires_at:            endsAt,
        polar_subscription_id: subscriptionId,
        amount:                order?.subscription?.amount ?? order?.totalAmount ?? 0,
        currency:              order?.subscription?.currency ?? order?.currency ?? 'USD',
        // Any prior cancel schedule is cleared by a fresh successful order.
        cancel_at_period_end: false,
      } as never, { onConflict: 'polar_subscription_id' })

    assertSupabaseSuccess('Polar order.paid subscription upsert failed', subWrite)
  }

  // Migration 021: set_subscription_credits atomically updates plan +
  // credits_remaining AND records the delta in credit_transactions.
  // Reason=subscription_grant; ref_id = Polar subscription id (if present)
  // or order id — both strings — so audit row points at the source event.
  await callSetSubscriptionCredits(supabase, {
    userId,
    planKey,
    credits,
    reason: 'subscription_grant',
    refId: (typeof subscriptionId === 'string' ? subscriptionId : null) ?? order?.id ?? null,
    context: 'Polar order.paid',
  })

  console.info(`Polar order.paid: user=${userId} plan=${planKey} credits=${credits}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionActive(supabase: any, sub: any) {
  const userId = resolveUserId(sub)

  if (!userId) {
    throw new Error(
      `Polar subscription.active: cannot resolve userId (subId=${sub?.id}, ` +
      `customer.externalId=${sub?.customer?.externalId}, ` +
      `metadata.userId=${sub?.metadata?.userId})`
    )
  }

  // Resolve productId: prefer sub.productId, fallback to sub.product.id
  const productId = sub?.productId ?? sub?.product?.id
  const product = resolveBillingProductByProductId(productId)
  if (!product || product.kind !== 'plan') {
    throw new Error(
      `Polar subscription.active: unknown product (subId=${sub?.id}, ` +
      `productId=${sub?.productId}, product.id=${sub?.product?.id}) — ` +
      `check POLAR_PRODUCT_ID_* env vars match Polar dashboard`
    )
  }

  const planKey = product.key
  const credits = product.credits
  const startsAt = sub.currentPeriodStart?.toISOString() ?? new Date().toISOString()
  const endsAt   = sub.currentPeriodEnd?.toISOString()   ?? null

  const subWrite = await supabase
    .from('subscriptions')
    .upsert({
      user_id:               userId,
      plan:                  planKey,
      status:                'active',
      starts_at:             startsAt,
      expires_at:            endsAt,
      polar_subscription_id: sub.id,
      amount:                sub.amount,
      currency:              sub.currency,
      // Reactivation clears any prior cancel_at_period_end flag.
      cancel_at_period_end: false,
    } as never, { onConflict: 'polar_subscription_id' })
  assertSupabaseSuccess('Polar subscription.active upsert failed', subWrite)

  await callSetSubscriptionCredits(supabase, {
    userId,
    planKey,
    credits,
    reason: 'subscription_grant',
    refId: typeof sub.id === 'string' ? sub.id : null,
    context: 'Polar subscription.active',
  })

  console.info(`Polar subscription.active: user=${userId} plan=${planKey} expires=${endsAt}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionRevoked(supabase: any, sub: any) {
  const userId = resolveUserId(sub)

  if (!userId) {
    throw new Error(
      `Polar subscription.revoked: cannot resolve userId (subId=${sub?.id}, ` +
      `customer.externalId=${sub?.customer?.externalId}, ` +
      `metadata.userId=${sub?.metadata?.userId})`
    )
  }

  const subWrite = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' } as never)
    .eq('polar_subscription_id', sub.id)
  assertSupabaseSuccess('Polar subscription.revoked status update failed', subWrite)

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
    await callSetSubscriptionCredits(supabase, {
      userId,
      planKey: 'free',
      credits: PLAN_META.free.credits,
      reason: 'subscription_downgrade',
      refId: typeof sub.id === 'string' ? sub.id : null,
      context: 'Polar subscription.revoked',
    })

    console.info(`Polar subscription.revoked: user=${userId} downgraded to free`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(supabase: any, sub: any) {
  // canceled = scheduled to end at period boundary; subscription still active until then.
  // MED-3: persist cancel_at_period_end=true so the billing UI can surface a
  // "cancellation pending" banner. subscription.revoked will fire when access
  // actually ends and we downgrade to free there.
  if (!sub?.id || typeof sub.id !== 'string') {
    console.warn('Polar subscription.canceled: missing sub.id — cannot persist flag')
    return
  }

  const flagWrite = await supabase
    .from('subscriptions')
    .update({ cancel_at_period_end: true } as never)
    .eq('polar_subscription_id', sub.id)
  assertSupabaseSuccess('Polar subscription.canceled flag update failed', flagWrite)

  console.info(
    `Polar subscription.canceled: subId=${sub.id} ` +
    `cancel_at_period_end=true endsAt=${sub.currentPeriodEnd?.toISOString() ?? 'unknown'}`
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderRefunded(supabase: any, order: any) {
  const productId = order?.productId ?? order?.product?.id
  const product = resolveBillingProductByProductId(productId ?? undefined)

  if (product?.kind === 'pack') {
    console.warn(
      `Polar order.refunded: one-time top-up refunded (orderId=${order?.id}, pack=${product.key}). ` +
      'Credits are not clawed back automatically; review credit_transactions manually.'
    )
    return
  }

  // MED-4 (audit 2026-04-16): Polar refunded or disputed the charge.
  // We mark the linked subscription cancelled immediately; credits that were
  // already consumed are not clawed back (would require transactional
  // reversal which is out of scope — manual review via credit_transactions
  // audit log if ever needed).
  const subscriptionId = order?.subscription?.id ?? order?.subscriptionId ?? null
  if (!subscriptionId || typeof subscriptionId !== 'string') {
    console.warn(
      `Polar order.refunded: no linked subscription (orderId=${order?.id}) — ` +
      `review manually if this was a subscription charge`
    )
    return
  }

  const subWrite = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancel_at_period_end: true } as never)
    .eq('polar_subscription_id', subscriptionId)
  assertSupabaseSuccess('Polar order.refunded subscription update failed', subWrite)

  console.warn(
    `Polar order.refunded: orderId=${order?.id} subId=${subscriptionId} — ` +
    `subscription marked cancelled; manual review of consumed credits required`
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceSupabase = any

async function callSetSubscriptionCredits(
  supabase: ServiceSupabase,
  args: {
    userId: string
    planKey: 'free' | 'starter' | 'pro' | 'business'
    credits: number
    reason: 'subscription_grant' | 'subscription_downgrade'
    refId: string | null
    context: string
  },
) {
  const { data, error } = await supabase.rpc('set_subscription_credits', {
    p_user_id: args.userId,
    p_plan: args.planKey,
    p_credits: args.credits,
    p_reason: args.reason,
    p_ref_id: args.refId,
  })

  if (error) {
    throw new Error(`${args.context} set_subscription_credits failed: ${error.message ?? 'unknown'}`)
  }

  if (data === -1) {
    // -1 means profile not found or invalid amount — treat as hard failure so
    // Polar retries delivery.
    throw new Error(
      `${args.context} set_subscription_credits: profile missing for user ${args.userId} ` +
      `(plan=${args.planKey})`,
    )
  }
}

async function callGrantTopupCredits(
  supabase: ServiceSupabase,
  args: {
    userId: string
    credits: number
    refId: string | null
    packKey: string
    context: string
  },
) {
  const { data, error } = await supabase.rpc('grant_topup_credits', {
    p_user_id: args.userId,
    p_amount: args.credits,
    p_ref_id: args.refId,
    p_metadata: {
      pack: args.packKey,
    },
  })

  if (error) {
    throw new Error(`${args.context} grant_topup_credits failed: ${error.message ?? 'unknown'}`)
  }

  if (data === -1) {
    throw new Error(
      `${args.context} grant_topup_credits: profile missing for user ${args.userId} ` +
      `(pack=${args.packKey})`,
    )
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract Supabase user ID from webhook payload.
 * Priority: customer.externalId → metadata.userId (set at checkout)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveUserId(payload: any): string | null {
  const fromCustomer = payload?.customer?.externalId
  if (fromCustomer && typeof fromCustomer === 'string') return fromCustomer

  const fromMeta = payload?.metadata?.userId
  if (fromMeta && typeof fromMeta === 'string') return fromMeta

  return null
}

function resolveBillingProductByProductId(productId: string | undefined):
  | { kind: 'plan'; key: 'starter' | 'pro' | 'business'; credits: number }
  | { kind: 'pack'; key: keyof typeof POLAR_CREDIT_PACKS; credits: number }
  | null {
  if (!productId) return null

  for (const [key, plan] of Object.entries(POLAR_PLANS)) {
    if (plan.productId && plan.productId === productId && isPolarPlanKey(key)) {
      return { kind: 'plan', key, credits: plan.credits }
    }
  }

  for (const [key, pack] of Object.entries(POLAR_CREDIT_PACKS)) {
    if (pack.productId && pack.productId === productId && isPolarCreditPackKey(key)) {
      return { kind: 'pack', key, credits: pack.credits }
    }
  }

  return null
}
