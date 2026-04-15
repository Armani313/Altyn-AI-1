// ── Plan metadata ─────────────────────────────────────────────────────────────
// Single source of truth for plan names and credit limits.
// lib/payments/kaspi.ts reads credits from here — update once, reflects everywhere.

import type { Plan } from '@/types/database.types'

interface PlanMeta {
  /** Russian display name shown in UI */
  label: string
  /** Monthly generation quota */
  credits: number
  /** Public monthly price in USD */
  monthlyPriceUsd: number
}

interface CreditPackMeta {
  /** One-time credits added on purchase */
  credits: number
  /** Public pack price in USD */
  priceUsd: number
}

export const PLAN_META: Record<Plan, PlanMeta> = {
  free:     { label: 'Бесплатный', credits: 3,   monthlyPriceUsd: 0  },
  starter:  { label: 'Старт',      credits: 10,  monthlyPriceUsd: 1  },
  pro:      { label: 'Про',        credits: 100, monthlyPriceUsd: 10 },
  business: { label: 'Бизнес',     credits: 250, monthlyPriceUsd: 25 },
}

export const PAID_PLAN_KEYS = ['starter', 'pro', 'business'] as const

export type PaidPlanKey = (typeof PAID_PLAN_KEYS)[number]

export const CREDIT_PACK_META = {
  topup_25: {
    credits: 25,
    priceUsd: 4,
  },
  topup_100: {
    credits: 100,
    priceUsd: 15,
  },
  topup_250: {
    credits: 250,
    priceUsd: 35,
  },
} satisfies Record<string, CreditPackMeta>

export type CreditPackKey = keyof typeof CREDIT_PACK_META

export const CREDIT_PACK_KEYS = Object.keys(CREDIT_PACK_META) as CreditPackKey[]

export function isCreditPackKey(key: string): key is CreditPackKey {
  return key in CREDIT_PACK_META
}

export function canAccessPremiumTemplates(plan: Plan | null | undefined): boolean {
  return plan === 'pro' || plan === 'business'
}

export function isPremiumTemplateLocked(
  plan: Plan | null | undefined,
  isPremium: boolean | null | undefined
): boolean {
  return Boolean(isPremium) && !canAccessPremiumTemplates(plan)
}

export function getGenerationQueuePriority(plan: Plan | null | undefined): number {
  switch (plan) {
    case 'business':
      return 3
    case 'pro':
      return 2
    case 'starter':
      return 1
    default:
      return 0
  }
}
