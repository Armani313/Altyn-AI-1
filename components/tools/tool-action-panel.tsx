'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

interface ToolActionPanelProps {
  children: ReactNode
  title?: string
  description?: string
}

export function ToolActionPanel({
  children,
  title,
  description,
}: ToolActionPanelProps) {
  const t = useTranslations('toolActions')

  return (
    <div className="rounded-[1.25rem] border border-cream-200 bg-white/88 p-4 shadow-soft">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {title ?? t('title')}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description ?? t('description')}
        </p>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}
