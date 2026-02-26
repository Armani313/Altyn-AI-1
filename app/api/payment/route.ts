/**
 * POST /api/payment
 *
 * Creates a Kaspi Pay payment session for a subscription plan.
 *
 * Request body (JSON):
 *   { plan: 'starter' | 'pro' }
 *
 * Response (JSON):
 *   { paymentUrl: string }  — redirect user to this URL
 *
 * Flow:
 *   1. Auth check
 *   2. Validate plan
 *   3. Create a pending subscription row
 *   4. Call Kaspi Pay API → get payment URL
 *   5. Update subscription row with kaspiOrderId
 *   6. Return paymentUrl to frontend
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createKaspiOrder,
  KASPI_PLANS,
  type PlanKey,
} from '@/lib/payments/kaspi'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться для оплаты.' },
        { status: 401 }
      )
    }

    // ── 2. Validate plan ───────────────────────────────────────────────────
    const body = (await request.json()) as { plan?: string }
    const planKey = body.plan as PlanKey | undefined

    if (!planKey || !(planKey in KASPI_PLANS)) {
      return NextResponse.json(
        { error: 'Неверный тарифный план. Доступны: starter, pro.' },
        { status: 400 }
      )
    }

    const plan = KASPI_PLANS[planKey]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // ── 3. Create pending subscription record ──────────────────────────────
    const subscriptionsRaw = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: planKey,
        status: 'pending',
        amount: plan.priceKZT,
        currency: 'KZT',
      } as never)
      .select('id')
      .single()

    // We use `as any` because the DB types need a real Supabase project to resolve.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subData = subscriptionsRaw.data as any
    const subError = subscriptionsRaw.error

    if (subError || !subData?.id) {
      console.error('Subscription insert error:', subError)
      return NextResponse.json(
        { error: 'Ошибка создания заказа. Попробуйте позже.' },
        { status: 500 }
      )
    }

    const subscriptionId: string = subData.id

    // ── 4. Create Kaspi Pay order ──────────────────────────────────────────
    let paymentUrl: string
    let kaspiOrderId: string

    try {
      const result = await createKaspiOrder({
        orderId: subscriptionId,
        planKey,
        returnUrl: `${appUrl}/settings/billing?status=success`,
      })
      paymentUrl = result.paymentUrl
      kaspiOrderId = result.kaspiOrderId
    } catch (err) {
      // Roll back pending subscription on payment API failure
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' } as never)
        .eq('id', subscriptionId)

      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : 'Ошибка платёжного шлюза. Попробуйте позже.',
        },
        { status: 502 }
      )
    }

    // ── 5. Store kaspiOrderId ──────────────────────────────────────────────
    await supabase
      .from('subscriptions')
      .update({ kaspi_order_id: kaspiOrderId } as never)
      .eq('id', subscriptionId)

    // ── 6. Return payment URL ──────────────────────────────────────────────
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    console.error('Payment route error:', err)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.' },
      { status: 500 }
    )
  }
}
