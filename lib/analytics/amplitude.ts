'use client'

import * as amplitude from '@amplitude/unified'

const AMPLITUDE_API_KEY = '6845abae0a5a5aee1cda5ddf86a2f5d1'

const AMPLITUDE_OPTIONS = {
  analytics: { autocapture: true },
  sessionReplay: { sampleRate: 1 },
} as const

declare global {
  interface Window {
    __luminifyAmplitudeInitPromise?: Promise<void>
  }
}

type EventProperties = Record<string, string | number | boolean | null | undefined>

export function initAmplitude() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (!window.__luminifyAmplitudeInitPromise) {
    window.__luminifyAmplitudeInitPromise = amplitude
      .initAll(AMPLITUDE_API_KEY, AMPLITUDE_OPTIONS)
      .catch((error) => {
        delete window.__luminifyAmplitudeInitPromise
        console.error('[Amplitude] Failed to initialize', error)
        throw error
      })
  }

  return window.__luminifyAmplitudeInitPromise
}

export async function trackAmplitudeEvent(
  eventName: string,
  eventProperties?: EventProperties
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    await initAmplitude()
    amplitude.track(eventName, eventProperties)
  } catch (error) {
    console.error(`[Amplitude] Failed to track ${eventName}`, error)
  }
}

export async function setAmplitudeUser(userId: string) {
  if (typeof window === 'undefined') return
  try {
    await initAmplitude()
    amplitude.setUserId(userId)
  } catch (error) {
    console.error('[Amplitude] Failed to set user id', error)
  }
}

export async function resetAmplitudeUser() {
  if (typeof window === 'undefined') return
  try {
    await initAmplitude()
    amplitude.reset()
  } catch (error) {
    console.error('[Amplitude] Failed to reset user', error)
  }
}
