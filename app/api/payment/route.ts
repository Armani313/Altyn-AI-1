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
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createKaspiOrder,
  KASPI_PLANS,
  type PlanKey,
} from '@/lib/payments/kaspi'
import { assertSafePaymentUrl } from '@/lib/utils/security'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться для оплаты.' },
        { status: 401 }
      )
    }

    // ── 2. Rate limit (HIGH-NEW-4: 5 payment attempts per hour) ───────────
    const rl = await checkRateLimit('payment', user.id, 5, 60 * 60_000)
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Слишком много попыток оплаты. Повторите через ${rl.retryAfterSec} сек.` },
        { status: 429 }
      )
    }

    // ── 3. Validate Content-Type + parse body (LOW-NEW-6) ─────────────────
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Ожидается Content-Type: application/json.' },
        { status: 415 }
      )
    }

    let body: { plan?: string }
    try {
      body = (await request.json()) as { plan?: string }
    } catch {
      return NextResponse.json({ error: 'Неверный формат JSON.' }, { status: 400 })
    }

    const planKey = body.plan as PlanKey | undefined

    if (!planKey || !(planKey in KASPI_PLANS)) {
      return NextResponse.json(
        { error: 'Неверный тарифный план. Доступны: starter, pro.' },
        { status: 400 }
      )
    }

    const plan   = KASPI_PLANS[planKey]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // ── 4. Create pending subscription record ──────────────────────────────
    const subscriptionsRaw = await supabase
      .from('subscriptions')
      .insert({
        user_id:  user.id,
        plan:     planKey,
        status:   'pending',
        amount:   plan.priceKZT,
        currency: 'KZT',
      } as never)
      .select('id')
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subData  = subscriptionsRaw.data as any
    const subError = subscriptionsRaw.error

    if (subError || !subData?.id) {
      console.error('Subscription insert error:', subError)
      return NextResponse.json(
        { error: 'Ошибка создания заказа. Попробуйте позже.' },
        { status: 500 }
      )
    }

    const subscriptionId: string = subData.id

    // ── 5. Create Kaspi Pay order ──────────────────────────────────────────
    let paymentUrl:  string
    let kaspiOrderId: string

    try {
      const result = await createKaspiOrder({
        orderId:   subscriptionId,
        planKey,
        returnUrl: `${appUrl}/settings/billing?status=success`,
      })
      paymentUrl   = result.paymentUrl
      kaspiOrderId = result.kaspiOrderId
    } catch {
      // HIGH-NEW-2: never expose raw Kaspi API error details to the client
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' } as never)
        .eq('id', subscriptionId)

      return NextResponse.json(
        { error: 'Ошибка платёжного шлюза. Попробуйте позже.' },
        { status: 502 }
      )
    }

    // ── 6. Validate paymentUrl (MED-NEW-3: prevent open redirect) ─────────
    try {
      assertSafePaymentUrl(paymentUrl)
    } catch (e) {
      console.error('Kaspi returned unsafe paymentUrl:', paymentUrl, e)
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' } as never)
        .eq('id', subscriptionId)

      return NextResponse.json(
        { error: 'Платёжный шлюз вернул некорректный ответ. Попробуйте позже.' },
        { status: 502 }
      )
    }

    // ── 7. Store kaspiOrderId ──────────────────────────────────────────────
    await supabase
      .from('subscriptions')
      .update({ kaspi_order_id: kaspiOrderId } as never)
      .eq('id', subscriptionId)

    return NextResponse.json({ paymentUrl })
  } catch (err) {
    console.error('Payment route error:', err)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.' },
      { status: 500 }
    )
  }
}
