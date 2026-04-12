'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const pathname = usePathname()
  const [profile, setProfile] = useState<DashboardProfileState>(initialProfile)

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
    void refreshProfile()
  }, [pathname, refreshProfile])

  useEffect(() => {
    const handleFocus = () => { void refreshProfile() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshProfile])

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
