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

export const PLAN_META: Record<Plan, PlanMeta> = {
  free:     { label: 'Бесплатный', credits: 5,   monthlyPriceUsd: 0  },
  starter:  { label: 'Старт',      credits: 20,  monthlyPriceUsd: 1  },
  pro:      { label: 'Про',        credits: 150, monthlyPriceUsd: 10 },
  business: { label: 'Бизнес',     credits: 500, monthlyPriceUsd: 25 },
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
