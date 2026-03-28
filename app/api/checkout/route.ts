/**
 * GET /api/checkout?plan=starter|pro
 *
 * Creates a Polar checkout session and redirects the user.
 * Requires authentication — unauthenticated users are redirected to /login.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { polar, POLAR_PLANS, isPolarPlanKey } from '@/lib/payments/polar'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── 2. Rate limit (5 checkout attempts per hour per user) ─────────────────
  const rl = await checkRateLimit('checkout', user.id, 5, 60 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Слишком много попыток. Повторите через ${rl.retryAfterSec} сек.` },
      { status: 429 }
    )
  }

  // ── 3. Validate plan param ────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const planKey = searchParams.get('plan')

  if (!planKey || !isPolarPlanKey(planKey)) {
    return NextResponse.json(
      { error: 'Неверный тариф. Доступны: starter, pro.' },
      { status: 400 }
    )
  }

  const plan   = POLAR_PLANS[planKey]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!plan.productId) {
    console.error(`POLAR_PRODUCT_ID_${planKey.toUpperCase()} is not configured`)
    return NextResponse.json(
      { error: 'Платёжный сервис не настроен. Обратитесь в поддержку.' },
      { status: 503 }
    )
  }

  // ── 4. Create Polar checkout session ──────────────────────────────────────
  try {
    const checkout = await polar.checkouts.create({
      products: [plan.productId],
      externalCustomerId: user.id,              // links to Supabase user
      customerEmail:      user.email ?? undefined,
      successUrl:         `${appUrl}/settings/billing?status=success`,
      metadata: {
        plan:   planKey,
        userId: user.id,
      },
    })

    return NextResponse.redirect(checkout.url)
  } catch (err) {
    console.error('Polar checkout creation failed:', err)
    return NextResponse.json(
      { error: 'Ошибка платёжного шлюза. Попробуйте позже.' },
      { status: 502 }
    )
  }
}
