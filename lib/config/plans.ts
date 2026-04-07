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
