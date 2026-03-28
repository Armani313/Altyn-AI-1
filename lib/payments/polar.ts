/**
 * Polar — Billing Integration (Sandbox)
 *
 * Polar acts as Merchant of Record: handles payments, tax, and subscriptions.
 * Sandbox dashboard: https://sandbox.polar.sh
 * Docs: https://polar.sh/docs
 *
 * Required env vars:
 *   POLAR_ACCESS_TOKEN       — Organization Access Token from sandbox.polar.sh
 *   POLAR_WEBHOOK_SECRET     — Webhook endpoint secret (polar_whs_...)
 *   POLAR_PRODUCT_ID_STARTER — Product ID for "Старт" plan
 *   POLAR_PRODUCT_ID_PRO     — Product ID for "Бренд Бизнес" plan
 */

import { Polar } from '@polar-sh/sdk'
import { PLAN_META } from '@/lib/config/plans'

// ── SDK Client (server-only) ──────────────────────────────────────────────────
// LOW-3: validate access token at module load time (fails fast instead of at checkout)
if (typeof window === 'undefined' && !process.env.POLAR_ACCESS_TOKEN) {
  console.error('POLAR_ACCESS_TOKEN is not configured — billing will not work')
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
  server: 'sandbox', // switch to 'production' when going live
})

// ── Plan → Polar Product mapping ──────────────────────────────────────────────

interface PolarPlan {
  productId: string
  credits: number
  label: string
}

// MED-1: warn if product IDs are empty/missing (catches typos like " " or missing env)
if (typeof window === 'undefined') {
  if (!process.env.POLAR_PRODUCT_ID_STARTER?.trim()) {
    console.error('POLAR_PRODUCT_ID_STARTER is not configured')
  }
  if (!process.env.POLAR_PRODUCT_ID_PRO?.trim()) {
    console.error('POLAR_PRODUCT_ID_PRO is not configured')
  }
}

export const POLAR_PLANS: Record<'starter' | 'pro', PolarPlan> = {
  starter: {
    productId: process.env.POLAR_PRODUCT_ID_STARTER?.trim() ?? '',
    credits: PLAN_META.starter.credits,
    label: PLAN_META.starter.label,
  },
  pro: {
    productId: process.env.POLAR_PRODUCT_ID_PRO?.trim() ?? '',
    credits: PLAN_META.pro.credits,
    label: PLAN_META.pro.label,
  },
}

export type PolarPlanKey = keyof typeof POLAR_PLANS

export function isPolarPlanKey(key: string): key is PolarPlanKey {
  return key in POLAR_PLANS
}
