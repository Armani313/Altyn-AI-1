/**
 * POST /api/webhooks/kaspi
 *
 * Kaspi Pay webhook handler.
 * Called by Kaspi servers when a payment status changes.
 *
 * Security:
 *   - Signature is verified via HMAC-SHA256 before any DB write.
 *   - Handler is idempotent (safe to receive the same event twice).
 *
 * On APPROVED:
 *   1. Mark subscription as active
 *   2. Set expiry date (+1 month)
 *   3. Update user plan and reset credits
 *
 * On DECLINED / REVERSED:
 *   1. Mark subscription as cancelled
 *   2. Revert user plan to 'free' if no other active subscription
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  verifyKaspiSignature,
  subscriptionExpiresAt,
  KASPI_PLANS,
  type KaspiWebhookPayload,
  type PlanKey,
} from '@/lib/payments/kaspi'

export const runtime = 'nodejs'

// Kaspi requires a 200 response quickly — don't do heavy work synchronously
// in production; enqueue to a background job instead.
export async function POST(request: Request) {
  // ── 1. Read raw body (needed for signature verification) ─────────────────
  const rawBody = await request.text()

  // ── 2. Verify signature ────────────────────────────────────────────────────
  const receivedSig =
    request.headers.get('X-Kaspi-Signature') ??
    request.headers.get('Kaspi-Signature') ??
    ''

  if (!verifyKaspiSignature(rawBody, receivedSig)) {
    console.warn('Kaspi webhook: invalid signature')
    return NextResponse.json(
      { error: 'Недействительная подпись запроса.' },
      { status: 401 }
    )
  }

  // ── 3. Parse payload ───────────────────────────────────────────────────────
  let payload: KaspiWebhookPayload
  try {
    payload = JSON.parse(rawBody) as KaspiWebhookPayload
  } catch {
    return NextResponse.json(
      { error: 'Неверный формат данных.' },
      { status: 400 }
    )
  }

  const { TxnId, OrderId, Status, Amount } = payload

  if (!TxnId || !OrderId || !Status) {
    return NextResponse.json(
      { error: 'Отсутствуют обязательные поля.' },
      { status: 400 }
    )
  }

  console.info(`Kaspi webhook: TxnId=${TxnId} OrderId=${OrderId} Status=${Status}`)

  const supabase = createServiceClient()

  // ── 4. Find matching subscription ─────────────────────────────────────────
  // OrderId was set to our subscription row id at creation time
  const { data: subRaw } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan, status')
    .eq('id', OrderId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subRaw as any

  if (!sub) {
    // Could be a test/retry for an unknown order — log and ack
    console.warn(`Kaspi webhook: subscription not found for OrderId=${OrderId}`)
    return NextResponse.json({ received: true })
  }

  // ── 5. Idempotency check ───────────────────────────────────────────────────
  if (sub.status === 'active' && Status === 'APPROVED') {
    // Already processed — acknowledge without mutation
    return NextResponse.json({ received: true })
  }

  // ── 6. Handle payment status ───────────────────────────────────────────────
  if (Status === 'APPROVED') {
    // MED-8: validate Amount against expected plan price before activating
    const planConfig = KASPI_PLANS[sub.plan as PlanKey]
    if (!planConfig) {
      console.error(`Kaspi webhook: unknown plan "${sub.plan}" for subscription ${sub.id}`)
      return NextResponse.json({ received: true })
    }
    if (!Amount || Amount < planConfig.priceKZT) {
      console.error(
        `Kaspi webhook: Amount ${Amount} KZT is less than expected ` +
        `${planConfig.priceKZT} KZT for plan "${sub.plan}" — rejecting activation`
      )
      return NextResponse.json(
        { error: 'Неверная сумма платежа.' },
        { status: 400 }
      )
    }
    await handleApproved(supabase, sub, Amount)
  } else if (Status === 'DECLINED' || Status === 'REVERSED') {
    await handleDeclined(supabase, sub)
  }
  // PENDING — do nothing, wait for a future APPROVED/DECLINED event

  return NextResponse.json({ received: true })
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleApproved(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sub: { id: string; user_id: string; plan: string },
  amount: number
) {
  const planKey = sub.plan as PlanKey
  const planConfig = KASPI_PLANS[planKey]

  if (!planConfig) {
    console.error(`Unknown plan key: ${planKey}`)
    return
  }

  const expiresAt = subscriptionExpiresAt()
  const now = new Date().toISOString()

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      starts_at: now,
      expires_at: expiresAt,
      amount,
    } as never)
    .eq('id', sub.id)

  // Update user profile — new plan + reset monthly credits
  await supabase
    .from('profiles')
    .update({
      plan: planKey,
      credits_remaining: planConfig.credits,
    } as never)
    .eq('id', sub.user_id)

  console.info(
    `Kaspi webhook: subscription ${sub.id} activated — ` +
      `plan=${planKey}, credits=${planConfig.credits}, expires=${expiresAt}`
  )
}

async function handleDeclined(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  sub: { id: string; user_id: string }
) {
  // Mark subscription as cancelled
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' } as never)
    .eq('id', sub.id)

  // Check if user has any other active subscription
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', sub.user_id)
    .eq('status', 'active')
    .limit(1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasActive = ((activeSubs as any[]) ?? []).length > 0

  if (!hasActive) {
    // Revert to free plan
    await supabase
      .from('profiles')
      .update({ plan: 'free' } as never)
      .eq('id', sub.user_id)
  }

  console.info(`Kaspi webhook: subscription ${sub.id} cancelled`)
}
