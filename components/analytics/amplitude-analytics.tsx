'use client'

import { useEffect } from 'react'
import {
  initAmplitude,
  resetAmplitudeUser,
  setAmplitudeUser,
} from '@/lib/analytics/amplitude'
import { createClient } from '@/lib/supabase/client'

export function AmplitudeAnalytics() {
  useEffect(() => {
    void initAmplitude()

    const supabase = createClient()

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.id) {
        void setAmplitudeUser(data.user.id)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user.id) {
          void setAmplitudeUser(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        void resetAmplitudeUser()
      }
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  return null
}
