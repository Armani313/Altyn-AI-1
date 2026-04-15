import type { Profile } from '@/types/database.types'

export type DashboardProfileState = Pick<
  Profile,
  'contact_name' | 'business_name' | 'credits_remaining' | 'plan' | 'trial_credits_decision'
> | null

export function pickDashboardProfile(
  value: Partial<Profile> | null | undefined
): DashboardProfileState {
  if (!value) {
    return null
  }

  return {
    contact_name: value.contact_name ?? null,
    business_name: value.business_name ?? null,
    credits_remaining: typeof value.credits_remaining === 'number' ? value.credits_remaining : 0,
    plan: value.plan ?? 'free',
    trial_credits_decision: value.trial_credits_decision ?? 'legacy',
  }
}
