'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LibraryGrid } from '@/components/library/library-grid'
import type { LibraryDisplayCard, LibraryPendingItem } from '@/lib/library/display-items'

interface LibraryGridShellProps {
  items: LibraryDisplayCard[]
  pendingItems?: LibraryPendingItem[]
}

export function LibraryGridShell({
  items,
  pendingItems = [],
}: LibraryGridShellProps) {
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<'all' | 'images' | 'videos'>('all')
  const t = useTranslations('library')
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || pendingItems.length === 0) return

    let cancelled = false
    let inFlight = false

    const probeStatuses = async () => {
      if (cancelled || inFlight) return
      inFlight = true

      try {
        const results = await Promise.allSettled(
          pendingItems.slice(0, 10).map(async (pendingItem) => {
            const path = pendingItem.mediaType === 'video'
              ? `/api/video-generations/${pendingItem.id}`
              : `/api/generations/${pendingItem.id}`

            const response = await fetch(path, {
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
  }, [mounted, pendingItems, router])

  const filteredItems = items.filter((item) => {
    if (filter === 'images') return item.mediaType === 'image'
    if (filter === 'videos') return item.mediaType === 'video'
    return true
  })

  if (!mounted) {
    if (items.length === 0) return null
    return <div className="min-h-[320px]" aria-hidden="true" />
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'all', label: t('filterAll') },
          { id: 'images', label: t('filterImages') },
          { id: 'videos', label: t('filterVideos') },
        ] as const).map((tab) => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'border-rose-gold-300 bg-rose-gold-50 text-rose-gold-700'
                  : 'border-cream-200 bg-white text-muted-foreground hover:border-rose-gold-200 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {filteredItems.length > 0 ? (
        <LibraryGrid items={filteredItems} />
      ) : (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-6 py-12 text-center">
          <p className="font-medium text-foreground">
            {filter === 'videos' ? t('emptyVideosTitle') : t('emptyImagesTitle')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === 'videos' ? t('emptyVideosDesc') : t('emptyImagesDesc')}
          </p>
        </div>
      )}
    </div>
  )
}
