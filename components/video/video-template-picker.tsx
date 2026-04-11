'use client'

import { Play, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { VideoTemplateListItem } from '@/lib/video/types'

interface VideoTemplatePickerProps {
  templates: VideoTemplateListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
  loading?: boolean
}

export function VideoTemplatePicker({
  templates,
  selectedId,
  onSelect,
  disabled = false,
  loading = false,
}: VideoTemplatePickerProps) {
  const t = useTranslations('videoTemplates')

  const templateName = (template: VideoTemplateListItem) =>
    t.has(`names.${template.id}`) ? t(`names.${template.id}`) : template.name

  const templateDescription = (template: VideoTemplateListItem) =>
    t.has(`descriptions.${template.id}`)
      ? t(`descriptions.${template.id}`)
      : (template.description ?? '')

  const templateBadge = (template: VideoTemplateListItem) =>
    t.has(`badges.${template.id}`)
      ? t(`badges.${template.id}`)
      : (template.label ?? '')

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft"
          >
            <div className="aspect-[9/16] animate-pulse bg-cream-100" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-cream-100" />
              <div className="h-3 w-full animate-pulse rounded bg-cream-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-cream-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-cream-50 px-6 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-rose-gold-500" />
        <p className="font-medium text-foreground">{t('emptyTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('emptyDesc')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {templates.map((template) => {
        const isSelected = selectedId === template.id
        const badge = templateBadge(template)

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            disabled={disabled}
            className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-soft transition-all duration-300 ${
              isSelected
                ? 'border-rose-gold-400 shadow-card ring-2 ring-rose-gold-200'
                : 'border-cream-200 hover:border-rose-gold-200 hover:shadow-card'
            }`}
          >
            <div className="relative aspect-[9/16] overflow-hidden bg-gradient-to-br from-slate-100 to-stone-200">
              <video
                src={template.demoVideoUrl}
                poster={template.coverImageUrl}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                muted
                loop
                autoPlay
                playsInline
                preload="metadata"
              />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                <span className="rounded-full border border-white/30 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                  {template.aspectRatio}
                </span>
                {badge ? (
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-soft">
                    {badge}
                  </span>
                ) : null}
              </div>

              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
                <Play className="h-3.5 w-3.5 fill-current" />
                {t('demo')}
              </div>
            </div>

            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {templateName(template)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {templateDescription(template)}
                  </p>
                </div>
                <span
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border transition-colors ${
                    isSelected
                      ? 'border-rose-gold-500 bg-rose-gold-500 shadow-glow'
                      : 'border-cream-300 bg-white'
                  }`}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
