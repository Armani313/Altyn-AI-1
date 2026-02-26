// ── Plan metadata ─────────────────────────────────────────────────────────────
// Single source of truth for plan names and credit limits.
// lib/payments/kaspi.ts reads credits from here — update once, reflects everywhere.

import type { Plan } from '@/types/database.types'

interface PlanMeta {
  /** Russian display name shown in UI */
  label: string
  /** Monthly generation quota */
  credits: number
}

export const PLAN_META: Record<Plan, PlanMeta> = {
  free:       { label: 'Бесплатный',   credits: 3   },
  starter:    { label: 'Старт',        credits: 30  },
  pro:        { label: 'Бренд Бизнес', credits: 150 },
  enterprise: { label: 'Enterprise',   credits: 500 },
}
