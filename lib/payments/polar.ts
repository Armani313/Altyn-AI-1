/**
 * Polar — Billing Integration
 *
 * Polar acts as Merchant of Record: handles payments, tax, and subscriptions.
 * Dashboard: https://polar.sh
 * Docs: https://polar.sh/docs
 *
 * Required env vars:
 *   POLAR_ACCESS_TOKEN       — Organization Access Token from polar.sh
 *   POLAR_WEBHOOK_SECRET     — Webhook endpoint secret (polar_whs_...)
 *   POLAR_PRODUCT_ID_STARTER  — Product ID for "Старт" plan
 *   POLAR_PRODUCT_ID_PRO      — Product ID for "Про" plan
 *   POLAR_PRODUCT_ID_BUSINESS — Product ID for "Бизнес" plan
 *   POLAR_PRODUCT_ID_TOPUP_25  — Product ID for one-time 25-credit pack
 *   POLAR_PRODUCT_ID_TOPUP_100 — Product ID for one-time 100-credit pack
 *   POLAR_PRODUCT_ID_TOPUP_250 — Product ID for one-time 250-credit pack
 *   POLAR_ENVIRONMENT         — 'production' (default) or 'sandbox'
 */

import { Polar } from '@polar-sh/sdk'
import {
  CREDIT_PACK_META,
  type CreditPackKey,
  PAID_PLAN_KEYS,
  PLAN_META,
  type PaidPlanKey,
} from '@/lib/config/plans'

const polarEnvironment = (process.env.POLAR_ENVIRONMENT as 'sandbox' | 'production' | undefined) ?? 'production'

export function getPolarServerConfigError(): string | null {
  if (typeof window !== 'undefined') return null

  if (
    process.env.NODE_ENV === 'production' &&
    polarEnvironment !== 'production'
  ) {
    return 'POLAR_ENVIRONMENT must be set to "production" when NODE_ENV=production'
  }

  if (!process.env.POLAR_ACCESS_TOKEN?.trim()) {
    return 'POLAR_ACCESS_TOKEN is not configured'
  }

  return null
}

// ── SDK Client (server-only) ──────────────────────────────────────────────────
// LOW-3: validate access token at module load time (fails fast instead of at checkout)
const polarConfigError = getPolarServerConfigError()
if (typeof window === 'undefined' && polarConfigError) {
  console.error(`${polarConfigError} — billing routes will return 503 until fixed`)
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  server: polarEnvironment,
})

// ── Plan → Polar Product mapping ──────────────────────────────────────────────

interface PolarProduct {
  productId: string
  credits: number
  label: string
}

// MED-1: warn if product IDs are empty/missing (catches typos like " " or missing env)
if (typeof window === 'undefined') {
  for (const name of [
    'POLAR_PRODUCT_ID_STARTER',
    'POLAR_PRODUCT_ID_PRO',
    'POLAR_PRODUCT_ID_BUSINESS',
    'POLAR_PRODUCT_ID_TOPUP_25',
    'POLAR_PRODUCT_ID_TOPUP_100',
    'POLAR_PRODUCT_ID_TOPUP_250',
  ]) {
    if (!process.env[name]?.trim()) {
      console.error(`${name} is not configured`)
    }
  }
}

export const POLAR_PLANS: Record<PaidPlanKey, PolarProduct> = Object.fromEntries(
  PAID_PLAN_KEYS.map((planKey) => [
    planKey,
    {
      productId: process.env[`POLAR_PRODUCT_ID_${planKey.toUpperCase()}`]?.trim() ?? '',
      credits: PLAN_META[planKey].credits,
      label: PLAN_META[planKey].label,
    },
  ])
) as Record<PaidPlanKey, PolarProduct>

export const POLAR_CREDIT_PACKS: Record<CreditPackKey, PolarProduct> = {
  topup_25: {
    productId: process.env.POLAR_PRODUCT_ID_TOPUP_25?.trim() ?? '',
    credits: CREDIT_PACK_META.topup_25.credits,
    label: '25 credits',
  },
  topup_100: {
    productId: process.env.POLAR_PRODUCT_ID_TOPUP_100?.trim() ?? '',
    credits: CREDIT_PACK_META.topup_100.credits,
    label: '100 credits',
  },
  topup_250: {
    productId: process.env.POLAR_PRODUCT_ID_TOPUP_250?.trim() ?? '',
    credits: CREDIT_PACK_META.topup_250.credits,
    label: '250 credits',
  },
}

export type PolarPlanKey = keyof typeof POLAR_PLANS
export type PolarCreditPackKey = keyof typeof POLAR_CREDIT_PACKS

export function isPolarPlanKey(key: string): key is PolarPlanKey {
  return key in POLAR_PLANS
}

export function isPolarCreditPackKey(key: string): key is PolarCreditPackKey {
  return key in POLAR_CREDIT_PACKS
}
