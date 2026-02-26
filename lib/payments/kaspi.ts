/**
 * Kaspi Pay — Merchant Integration
 *
 * Reference: Kaspi Bank Merchant API (kaspi.kz/business)
 * To activate: register as a merchant at kaspi.kz/business,
 * then obtain KASPI_MERCHANT_ID and KASPI_API_KEY from your merchant cabinet.
 *
 * API base: https://mc.kaspi.kz/api/v1  (production)
 *           https://mc.kaspi.kz/api/v1  (sandbox — use test credentials)
 */

import { createHmac } from 'crypto'
import { PLAN_META } from '@/lib/config/plans'

// ── Plan configuration ────────────────────────────────────────────────────────
// Credits come from PLAN_META — update lib/config/plans.ts, not here.

interface KaspiPlan {
  name: string
  priceKZT: number
  credits: number
  description: string
}

export const KASPI_PLANS = {
  starter: {
    name: PLAN_META.starter.label,
    priceKZT: 9_900,
    credits: PLAN_META.starter.credits,
    description: `Nurai AI Studio — тариф Старт (${PLAN_META.starter.credits} генераций в месяц)`,
  },
  pro: {
    name: PLAN_META.pro.label,
    priceKZT: 29_900,
    credits: PLAN_META.pro.credits,
    description: `Nurai AI Studio — тариф Бренд Бизнес (${PLAN_META.pro.credits} генераций в месяц)`,
  },
} satisfies Record<string, KaspiPlan>

export type PlanKey = keyof typeof KASPI_PLANS

// ── Payment order creation ────────────────────────────────────────────────────

export interface KaspiOrderRequest {
  orderId: string        // unique order ID in our system (e.g. sub_uuid)
  planKey: PlanKey
  returnUrl: string      // redirect after payment
}

export interface KaspiOrderResponse {
  paymentUrl: string     // URL to redirect user to Kaspi payment page
  kaspiOrderId: string   // order ID assigned by Kaspi
}

/**
 * Creates a payment order with Kaspi Pay.
 *
 * Kaspi Merchant API endpoint (POST):
 *   https://mc.kaspi.kz/api/v1/orders/create
 *
 * Required headers:
 *   Authorization: Bearer {KASPI_API_KEY}
 *   Content-Type: application/json
 *
 * Required body fields (documented by Kaspi):
 *   MerchantId, OrderId, Amount, Currency, Description,
 *   ReturnUrl, CallbackUrl
 */
export async function createKaspiOrder(
  params: KaspiOrderRequest
): Promise<KaspiOrderResponse> {
  const merchantId = process.env.KASPI_MERCHANT_ID
  const apiKey = process.env.KASPI_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!merchantId || !apiKey) {
    throw new Error('Платёжный сервис не настроен. Обратитесь в поддержку.')
  }

  const plan = KASPI_PLANS[params.planKey]

  const payload = {
    MerchantId: merchantId,
    OrderId: params.orderId,
    Amount: plan.priceKZT,
    Currency: 'KZT',
    Description: plan.description,
    ReturnUrl: params.returnUrl,
    CallbackUrl: `${appUrl}/api/webhooks/kaspi`,
    // Kaspi-specific fields (verify exact names in your merchant docs):
    Service: 'Nurai AI Studio',
    DeviceId: null,
  }

  const response = await fetch('https://mc.kaspi.kz/api/v1/orders/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    console.error('Kaspi order creation failed:', body)
    throw new Error(
      'Не удалось создать платёж. Попробуйте позже или обратитесь в поддержку.'
    )
  }

  const data = (await response.json()) as {
    PaymentUrl?: string
    OrderId?: string
    // Kaspi may return different field names — verify with actual docs
    paymentUrl?: string
    orderId?: string
  }

  const paymentUrl = data.PaymentUrl ?? data.paymentUrl
  const kaspiOrderId = data.OrderId ?? data.orderId ?? params.orderId

  if (!paymentUrl) {
    throw new Error('Kaspi не вернул ссылку на оплату. Повторите попытку.')
  }

  return { paymentUrl, kaspiOrderId }
}

// ── Webhook signature verification ───────────────────────────────────────────

/**
 * Kaspi signs webhooks with HMAC-SHA256.
 *
 * Signature string format (verify in your merchant docs):
 *   {TxnId}{OrderId}{Status}{Amount}
 *
 * Header: X-Kaspi-Signature  (or Kaspi-Signature — check your docs)
 */
export function verifyKaspiSignature(
  rawBody: string,
  receivedSignature: string
): boolean {
  const secret = process.env.KASPI_WEBHOOK_SECRET
  if (!secret) {
    console.warn('KASPI_WEBHOOK_SECRET not set — skipping signature verification')
    return process.env.NODE_ENV !== 'production' // allow in dev, block in prod
  }

  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expected, receivedSignature)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// ── Webhook payload types ─────────────────────────────────────────────────────

export type KaspiPaymentStatus = 'APPROVED' | 'DECLINED' | 'REVERSED' | 'PENDING'

export interface KaspiWebhookPayload {
  TxnId: string
  OrderId: string           // matches our subscriptions.kaspi_order_id
  Status: KaspiPaymentStatus
  Amount: number
  Currency: string
  Reason?: string           // present on DECLINED/REVERSED
  Signature?: string
}

// ── Month helpers ─────────────────────────────────────────────────────────────

export function subscriptionExpiresAt(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString()
}
