'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LibraryGrid } from '@/components/library/library-grid'
import type { LibraryDisplayCard } from '@/lib/library/display-items'

interface LibraryGridShellProps {
  items: LibraryDisplayCard[]
  pendingGenerationIds?: string[]
}

export function LibraryGridShell({
  items,
  pendingGenerationIds = [],
}: LibraryGridShellProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || pendingGenerationIds.length === 0) return

    let cancelled = false
    let inFlight = false

    const probeStatuses = async () => {
      if (cancelled || inFlight) return
      inFlight = true

      try {
        const results = await Promise.allSettled(
          pendingGenerationIds.slice(0, 10).map(async (generationId) => {
            const response = await fetch(`/api/generations/${generationId}`, {
              cache: 'no-store',
              credentials: 'same-origin',
            })

            if (!response.ok) return null
            return response.json() as Promise<{ status?: string }>
          })
        )

        if (cancelled) return

        const hasSettledGeneration = results.some(
          (result) =>
            result.status === 'fulfilled' &&
            (result.value?.status === 'completed' || result.value?.status === 'failed')
        )

        if (hasSettledGeneration) {
          router.refresh()
        }
      } finally {
        inFlight = false
      }
    }

    void probeStatuses()
    const intervalId = window.setInterval(() => {
      void probeStatuses()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [mounted, pendingGenerationIds, router])

  if (!mounted) {
    if (items.length === 0) return null
    return <div className="min-h-[320px]" aria-hidden="true" />
  }

  if (items.length === 0) {
    return null
  }

  return <LibraryGrid items={items} />
}
