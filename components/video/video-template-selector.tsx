'use client'

import { Film, Search, Sparkles, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoTemplatePicker } from '@/components/video/video-template-picker'
import type { VideoTemplateListItem } from '@/lib/video/types'
import type { Plan } from '@/types/database.types'

interface VideoTemplateSelectorProps {
  templates: VideoTemplateListItem[]
  selectedTemplate: VideoTemplateListItem | null
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
  loading?: boolean
  currentPlan?: Plan | null
}

export function VideoTemplateSelector({
  templates,
  selectedTemplate,
  selectedId,
  onSelect,
  disabled = false,
  loading = false,
  currentPlan = 'free',
}: VideoTemplateSelectorProps) {
  const t = useTranslations('video')
  const tTemplates = useTranslations('videoTemplates')
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'ugc' | 'motion'>('all')

  const templateName = selectedTemplate
    ? (tTemplates.has(`names.${selectedTemplate.id}`)
        ? tTemplates(`names.${selectedTemplate.id}`)
        : selectedTemplate.name)
    : t('noTemplate')

  const templateDescription = selectedTemplate
    ? (tTemplates.has(`descriptions.${selectedTemplate.id}`)
        ? tTemplates(`descriptions.${selectedTemplate.id}`)
        : (selectedTemplate.description ?? ''))
    : t('templateSelectorEmptyDesc')

  const templateBadge = selectedTemplate
    ? (tTemplates.has(`badges.${selectedTemplate.id}`)
        ? tTemplates(`badges.${selectedTemplate.id}`)
        : (selectedTemplate.label ?? ''))
    : null

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return templates.filter((template) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'ugc'
            ? template.id.startsWith('ugc-')
            : !template.id.startsWith('ugc-')

      if (!matchesFilter) return false
      if (!normalizedQuery) return true

      const haystack = [
        template.name,
        template.description ?? '',
        template.label ?? '',
        tTemplates.has(`names.${template.id}`) ? tTemplates(`names.${template.id}`) : '',
        tTemplates.has(`descriptions.${template.id}`) ? tTemplates(`descriptions.${template.id}`) : '',
        tTemplates.has(`badges.${template.id}`) ? tTemplates(`badges.${template.id}`) : '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [filter, searchQuery, tTemplates, templates])

  const filterOptions = [
    { id: 'all' as const, label: t('templateFilterAll'), icon: Film },
    { id: 'ugc' as const, label: t('templateFilterUgc'), icon: Users },
    { id: 'motion' as const, label: t('templateFilterMotion'), icon: Sparkles },
  ]

  return (
    <>
      <div className="rounded-[28px] border border-cream-200 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-gold-500">
              {t('selectedTemplate')}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {templateName}
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {templateDescription}
            </p>
          </div>

          {selectedTemplate ? (
            <span className="rounded-full border border-rose-gold-200 bg-rose-gold-50 px-3 py-1 text-[11px] font-semibold text-rose-gold-700">
              {t('templateSelectedBadge')}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[24px] border border-cream-200 bg-[#fcfaf7] p-3">
          <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-[18px] border border-cream-200 bg-cream-100">
            {selectedTemplate ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${selectedTemplate.coverImageUrl})` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-100 via-white to-cream-100">
                <Sparkles className="h-5 w-5 text-rose-gold-500" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cream-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                9:16
              </span>
              {templateBadge ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-soft">
                  {templateBadge}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t('templateSelectorHint')}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="mt-4 h-11 w-full rounded-2xl border-cream-200 bg-cream-50 text-sm font-semibold text-foreground hover:border-rose-gold-200 hover:bg-white"
        >
          {selectedTemplate ? t('templateChangeCta') : t('templateChooseCta')}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-2 right-2 top-2 bottom-2 flex h-auto w-auto translate-x-0 translate-y-0 flex-col overflow-hidden border-cream-200 bg-[#fcfaf7] p-0 shadow-card sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:h-[min(92dvh,860px)] sm:w-[calc(100vw-1rem)] sm:max-w-6xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[32px]">
          <DialogHeader className="shrink-0 border-b border-cream-200 bg-white px-5 py-4 sm:px-6">
            <DialogTitle className="text-left font-serif text-2xl font-medium text-foreground">
              {t('templateDialogTitle')}
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              {t('templateDialogDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 border-b border-cream-200 bg-[#fcfaf7] px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t('templateSearchPlaceholder')}
                  className="h-11 rounded-2xl border-cream-200 bg-white pl-10 pr-4 shadow-none"
                  aria-label={t('templateSearchPlaceholder')}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => {
                  const Icon = option.icon
                  const active = filter === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFilter(option.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-rose-gold-300 bg-rose-gold-50 text-rose-gold-700'
                          : 'border-cream-200 bg-white text-muted-foreground hover:border-rose-gold-200 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {t('templateResultsCount', { count: filteredTemplates.length })}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 touch-pan-y [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-5">
            {filteredTemplates.length > 0 || loading ? (
              <VideoTemplatePicker
                templates={filteredTemplates}
                selectedId={selectedId}
                onSelect={(id) => {
                  onSelect(id)
                  setOpen(false)
                }}
                disabled={disabled}
                loading={loading}
                currentPlan={currentPlan}
                compact
              />
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-dashed border-cream-300 bg-white px-6 text-center">
                <Search className="mb-3 h-8 w-8 text-rose-gold-500" />
                <p className="text-base font-semibold text-foreground">
                  {t('templateDialogNoResultsTitle')}
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t('templateDialogNoResultsDesc')}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
