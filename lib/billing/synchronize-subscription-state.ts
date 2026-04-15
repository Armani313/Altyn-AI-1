import 'server-only'

import { PLAN_META } from '@/lib/config/plans'
import { createServiceClient } from '@/lib/supabase/service'
import type { Plan, Subscription } from '@/types/database.types'

type ProfileBillingRow = {
  plan: Plan
  credits_remaining: number
}

type ActiveSubscriptionRow = Pick<
  Subscription,
  'id' | 'plan' | 'status' | 'expires_at' | 'created_at'
>

function isSubscriptionActive(
  subscription: ActiveSubscriptionRow,
  nowMs: number
) {
  if (subscription.status !== 'active') {
    return false
  }

  if (!subscription.expires_at) {
    return true
  }

  const expiresAtMs = Date.parse(subscription.expires_at)
  if (Number.isNaN(expiresAtMs)) {
    return true
  }

  return expiresAtMs > nowMs
}

function compareSubscriptionsByRecency(
  left: ActiveSubscriptionRow,
  right: ActiveSubscriptionRow
) {
  const leftExpires = left.expires_at ? Date.parse(left.expires_at) : Number.POSITIVE_INFINITY
  const rightExpires = right.expires_at ? Date.parse(right.expires_at) : Number.POSITIVE_INFINITY

  if (leftExpires !== rightExpires) {
    return rightExpires - leftExpires
  }

  return Date.parse(right.created_at) - Date.parse(left.created_at)
}

export async function synchronizeSubscriptionState(userId: string) {
  const serviceSupabase = createServiceClient()

  const [profileRes, activeSubscriptionsRes] = await Promise.all([
    serviceSupabase
      .from('profiles')
      .select('plan, credits_remaining')
      .eq('id', userId)
      .maybeSingle(),
    serviceSupabase
      .from('subscriptions')
      .select('id, plan, status, expires_at, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ])

  if (profileRes.error) {
    throw new Error(`Billing sync failed to read profile: ${profileRes.error.message}`)
  }

  if (activeSubscriptionsRes.error) {
    throw new Error(
      `Billing sync failed to read subscriptions: ${activeSubscriptionsRes.error.message}`
    )
  }

  const profile = profileRes.data as ProfileBillingRow | null
  if (!profile) {
    return
  }

  const activeSubscriptions = (activeSubscriptionsRes.data ?? []) as ActiveSubscriptionRow[]
  const nowMs = Date.now()

  const expiredSubscriptionIds = activeSubscriptions
    .filter((subscription) => !isSubscriptionActive(subscription, nowMs))
    .map((subscription) => subscription.id)

  if (expiredSubscriptionIds.length > 0) {
    const expireWrite = await serviceSupabase
      .from('subscriptions')
      .update({ status: 'expired' } as never)
      .in('id', expiredSubscriptionIds)

    if (expireWrite.error) {
      throw new Error(
        `Billing sync failed to expire subscriptions: ${expireWrite.error.message}`
      )
    }
  }

  const currentSubscription = activeSubscriptions
    .filter((subscription) => !expiredSubscriptionIds.includes(subscription.id))
    .filter((subscription) => isSubscriptionActive(subscription, nowMs))
    .sort(compareSubscriptionsByRecency)[0] ?? null

  const effectivePlan: Plan = currentSubscription ? currentSubscription.plan : 'free'

  if (profile.plan === effectivePlan) {
    return
  }

  let nextCreditsRemaining = PLAN_META.free.credits
  if (currentSubscription) {
    nextCreditsRemaining = Math.max(
      profile.credits_remaining,
      PLAN_META[currentSubscription.plan].credits
    )
  }

  const profileWrite = await serviceSupabase
    .from('profiles')
    .update({
      plan: effectivePlan,
      credits_remaining: nextCreditsRemaining,
    } as never)
    .eq('id', userId)

  if (profileWrite.error) {
    throw new Error(`Billing sync failed to update profile: ${profileWrite.error.message}`)
  }
}
