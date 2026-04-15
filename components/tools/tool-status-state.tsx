'use client'

import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

type ToolStatusMode = 'processing' | 'error'

interface ToolStatusStateProps {
  mode: ToolStatusMode
  progress?: number
  title?: string
  description?: string
  detail?: string
  className?: string
}

export function ToolStatusState({
  mode,
  progress,
  title,
  description,
  detail,
  className,
}: ToolStatusStateProps) {
  const t = useTranslations('toolStates')

  const defaults = mode === 'processing'
    ? {
        label: t('processingLabel'),
        title: title ?? t('processingTitle'),
        description: description ?? t('processingHint'),
      }
    : {
        label: t('errorLabel'),
        title: title ?? t('errorTitle'),
        description: description ?? t('errorHint'),
      }

  return (
    <div
      role={mode === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'mx-auto flex max-w-sm flex-col items-center gap-4 rounded-[1.5rem] border bg-white/90 px-5 py-6 text-center shadow-soft backdrop-blur',
        mode === 'processing'
          ? 'border-rose-gold-200/80'
          : 'border-destructive/20',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
          mode === 'processing'
            ? 'bg-rose-gold-100 text-rose-gold-700'
            : 'bg-destructive/10 text-destructive',
        )}
      >
        {mode === 'processing' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5" />
        )}
        {defaults.label}
      </span>

      <div className="space-y-1.5">
        <p className="font-medium text-foreground">{defaults.title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{defaults.description}</p>
        {detail ? <p className="text-sm leading-relaxed text-foreground/85">{detail}</p> : null}
      </div>

      {mode === 'processing' && typeof progress === 'number' ? (
        <div className="w-full max-w-[220px] space-y-2">
          <div className="overflow-hidden rounded-full bg-cream-300">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-rose-gold-400 via-rose-gold-500 to-rose-gold-600 transition-all duration-500"
              style={{ width: `${Math.max(8, Math.min(progress || 8, 100))}%` }}
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{Math.max(0, Math.round(progress))}%</p>
        </div>
      ) : null}
    </div>
  )
}

interface ToolSuccessBadgeProps {
  className?: string
}

export function ToolSuccessBadge({ className }: ToolSuccessBadgeProps) {
  const t = useTranslations('toolStates')

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/92 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-soft backdrop-blur',
        className,
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {t('successLabel')}
    </div>
  )
}
