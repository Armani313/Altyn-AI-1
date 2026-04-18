'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database.types'

export type DashboardProfileState = Pick<
  Profile,
  'contact_name' | 'business_name' | 'credits_remaining' | 'plan' | 'trial_credits_decision'
> | null

interface DashboardProfileContextValue {
  profile: DashboardProfileState
  refreshProfile: () => Promise<void>
  setCreditsRemaining: (credits: number | null) => void
}

const PROFILE_SELECT = 'contact_name, business_name, credits_remaining, plan, trial_credits_decision'

const DashboardProfileContext = createContext<DashboardProfileContextValue | null>(null)

export function DashboardProfileProvider({
  initialProfile,
  children,
}: {
  initialProfile: DashboardProfileState
  children: ReactNode
}) {
  const MAX_TRIAL_CLAIM_RETRIES = 3
  const pathname = usePathname()
  const [profile, setProfile] = useState<DashboardProfileState>(initialProfile)
  const [trialClaimRetrySeed, setTrialClaimRetrySeed] = useState(0)
  const trialClaimAttemptedRef = useRef(false)
  const trialClaimRetryCountRef = useRef(0)
  const trialClaimRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshProfile = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setProfile(null)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .single()

    setProfile(data as DashboardProfileState)
  }, [])

  const setCreditsRemaining = useCallback((credits: number | null) => {
    if (credits == null) return

    setProfile((current) => {
      if (!current) return current
      if (current.credits_remaining === credits) return current
      return { ...current, credits_remaining: credits }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        void refreshProfile()
      }
    })
    return () => {
      cancelled = true
    }
  }, [pathname, refreshProfile])

  useEffect(() => {
    const handleFocus = () => { void refreshProfile() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshProfile])

  useEffect(() => {
    return () => {
      if (trialClaimRetryTimeoutRef.current) {
        clearTimeout(trialClaimRetryTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (profile?.trial_credits_decision !== 'pending') {
      trialClaimAttemptedRef.current = false
      trialClaimRetryCountRef.current = 0
      if (trialClaimRetryTimeoutRef.current) {
        clearTimeout(trialClaimRetryTimeoutRef.current)
        trialClaimRetryTimeoutRef.current = null
      }
      return
    }

    if (trialClaimAttemptedRef.current) {
      return
    }

    trialClaimAttemptedRef.current = true

    const scheduleRetry = () => {
      if (trialClaimRetryCountRef.current >= MAX_TRIAL_CLAIM_RETRIES) {
        return
      }

      trialClaimRetryCountRef.current += 1

      if (trialClaimRetryTimeoutRef.current) {
        clearTimeout(trialClaimRetryTimeoutRef.current)
      }

      trialClaimRetryTimeoutRef.current = setTimeout(() => {
        trialClaimRetryTimeoutRef.current = null
        setTrialClaimRetrySeed((value) => value + 1)
      }, 1500 * trialClaimRetryCountRef.current)
    }

    void (async () => {
      try {
        const response = await fetch('/api/auth/claim-trial', { method: 'POST' })
        if (!response.ok) {
          trialClaimAttemptedRef.current = false
          scheduleRetry()
          return
        }
      } catch {
        trialClaimAttemptedRef.current = false
        scheduleRetry()
        return
      }

      trialClaimRetryCountRef.current = 0
      await refreshProfile()
    })()
  }, [profile?.trial_credits_decision, refreshProfile, trialClaimRetrySeed])

  const value = useMemo<DashboardProfileContextValue>(() => ({
    profile,
    refreshProfile,
    setCreditsRemaining,
  }), [profile, refreshProfile, setCreditsRemaining])

  return (
    <DashboardProfileContext.Provider value={value}>
      {children}
    </DashboardProfileContext.Provider>
  )
}

export function useDashboardProfile() {
  return useContext(DashboardProfileContext)
}
