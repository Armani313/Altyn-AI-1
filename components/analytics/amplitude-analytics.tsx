'use client'

import { useEffect } from 'react'
import { initAmplitude } from '@/lib/analytics/amplitude'

export function AmplitudeAnalytics() {
  useEffect(() => {
    void initAmplitude()
  }, [])

  return null
}
