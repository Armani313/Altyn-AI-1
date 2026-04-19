'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Users, Plus, Check, ArrowRight, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { TemplatePicker } from '@/components/generate/template-picker'
import {
  MODEL_PHOTO_MAP,
  AI_FREE_LIFESTYLE_ID,
  MACRO_SHOT_ID,
  isCustomModelId,
  getCustomModelIndex,
  type ProductType,
} from '@/lib/constants'
import type { Plan } from '@/types/database.types'

interface ModelPickerModalProps {
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  maxSelect?: number
  disabled?: boolean
  currentPlan?: Plan | null
  productType?: ProductType
  customModelUrls: string[]
  onCustomModelUrlsChange: (urls: string[]) => void
}

type ThumbMeta =
  | { kind: 'ai' }
  | { kind: 'macro' }
  | { kind: 'custom'; url: string | null; index: number }
  | { kind: 'model'; src: string; name: string }

function getThumbMeta(id: string, customModelUrls: string[]): ThumbMeta | null {
  if (id === AI_FREE_LIFESTYLE_ID) return { kind: 'ai' }
  if (id === MACRO_SHOT_ID) return { kind: 'macro' }
  if (isCustomModelId(id)) {
    const index = getCustomModelIndex(id)
    if (index < 0) return null
    return { kind: 'custom', url: customModelUrls[index] ?? null, index }
  }
  const model = MODEL_PHOTO_MAP[id]
  if (!model) return null
  return { kind: 'model', src: `/models/${model.filename}`, name: model.name }
}

export function ModelPickerModal({
  selectedIds,
  onSelect,
  maxSelect = 4,
  disabled = false,
  currentPlan = 'free',
  productType = 'jewelry',
  customModelUrls,
  onCustomModelUrlsChange,
}: ModelPickerModalProps) {
  const t = useTranslations('dashboard')
  const tPicker = useTranslations('templatePicker')
  const [open, setOpen] = useState(false)

  const selectedMeta = useMemo(
    () =>
      selectedIds
        .map((id) => ({ id, meta: getThumbMeta(id, customModelUrls) }))
        .filter((v): v is { id: string; meta: ThumbMeta } => v.meta !== null),
    [selectedIds, customModelUrls],
  )

  const count = selectedIds.length
  const hasSelection = count > 0

  const safeT = (key: string, fallback: string, vars?: Record<string, string | number>) => {
    // next-intl throws if key missing — fall back gracefully so we don't block render
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (t as any).has?.(key) ? (t as any)(key, vars) : fallback
    } catch {
      return fallback
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`
          group w-full text-left rounded-2xl border-2 transition-all duration-200
          ${hasSelection
            ? 'border-primary/60 bg-white shadow-soft hover:shadow-glow'
            : 'border-dashed border-rose-gold-300 bg-rose-gold-50/60 hover:border-rose-gold-400 hover:bg-rose-gold-50'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          p-4 sm:p-5
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0
              ${hasSelection ? 'gradient-rose-gold text-white shadow-soft' : 'bg-white border border-rose-gold-200 text-rose-gold-600'}
            `}
          >
            {hasSelection ? (
              <Check className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-sm sm:text-base text-foreground">
                {hasSelection
                  ? safeT('modelsPickedTitle', 'Модели выбраны', { count, max: maxSelect })
                  : safeT('modelsPickTitle', 'Выберите моделей')}
              </span>
              {hasSelection && (
                <span className="text-[11px] font-semibold text-primary bg-rose-gold-100 rounded-full px-2 py-0.5">
                  {count}/{maxSelect}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {hasSelection
                ? safeT('modelsPickedHint', 'Нажмите, чтобы изменить выбор или добавить свою модель.')
                : safeT('modelsPickHint', 'Откройте галерею моделей, AI-подборку или загрузите своё лицо.')}
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span className="hidden sm:inline">
              {hasSelection
                ? safeT('modelsOpenEdit', 'Изменить')
                : safeT('modelsOpenCta', 'Выбрать')}
            </span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {hasSelection && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {selectedMeta.map(({ id, meta }, idx) => (
              <div
                key={id}
                className="relative flex-shrink-0 w-12 h-16 sm:w-14 sm:h-[72px] rounded-lg overflow-hidden border border-cream-200 bg-cream-100"
                title={meta.kind === 'model' ? meta.name : undefined}
              >
                {meta.kind === 'ai' && (
                  <div className="w-full h-full bg-gradient-to-br from-rose-gold-400 to-rose-900 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                {meta.kind === 'macro' && (
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">MACRO</span>
                  </div>
                )}
                {meta.kind === 'custom' && meta.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.url}
                    alt={tPicker('myModelN', { n: meta.index + 1 })}
                    className="w-full h-full object-cover object-top"
                    draggable={false}
                  />
                )}
                {meta.kind === 'custom' && !meta.url && (
                  <div className="w-full h-full flex items-center justify-center text-rose-gold-400">
                    <Plus className="w-4 h-4" />
                  </div>
                )}
                {meta.kind === 'model' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.src}
                    alt={meta.name}
                    className="w-full h-full object-cover object-top"
                    draggable={false}
                    loading="lazy"
                  />
                )}
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {idx + 1}
                </span>
              </div>
            ))}
            {count < maxSelect && (
              <div className="flex-shrink-0 w-12 h-16 sm:w-14 sm:h-[72px] rounded-lg border-2 border-dashed border-rose-gold-200 bg-white flex items-center justify-center text-rose-gold-400">
                <Plus className="w-4 h-4" />
              </div>
            )}
          </div>
        )}

        {!hasSelection && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-rose-gold-100 to-rose-gold-200"
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {safeT(
                'modelsLibraryHint',
                '40+ моделей · AI-подборка · свой загруженный образ',
              )}
            </span>
          </div>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[min(1100px,95vw)] h-[min(90vh,900px)] p-0 gap-0 flex flex-col overflow-hidden sm:rounded-3xl border border-cream-200 bg-[#FAF9F6]"
        >
          <div className="flex items-start justify-between gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-cream-200 bg-white/80 backdrop-blur">
            <div className="min-w-0">
              <DialogTitle className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                {safeT('modelsModalTitle', 'Выберите моделей для лайфстайл-фото')}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {safeT(
                  'modelsModalSubtitle',
                  'Подберите до {max} моделей или дайте AI подобрать автоматически. Загрузите свою модель, чтобы получить персональный образ.',
                  { max: maxSelect },
                )}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={safeT('modelsModalClose', 'Закрыть')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden px-5 sm:px-7 py-4 sm:py-5">
            <div className="h-full bg-white rounded-2xl border border-cream-200 p-3 sm:p-4 shadow-soft overflow-hidden">
              <TemplatePicker
                selectedIds={selectedIds}
                onSelect={onSelect}
                maxSelect={maxSelect}
                disabled={disabled}
                currentPlan={currentPlan}
                productType={productType}
                customModelUrls={customModelUrls}
                onCustomModelUrlsChange={onCustomModelUrlsChange}
              />
            </div>
          </div>

          <div className="border-t border-cream-200 bg-white px-5 sm:px-7 py-3.5 flex items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-muted-foreground">
              {count > 0
                ? safeT('modelsModalFooterSelected', 'Выбрано {count} из {max}', { count, max: maxSelect })
                : safeT('modelsModalFooterEmpty', 'Выберите хотя бы одну модель')}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`
                inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all touch-feedback
                ${hasSelection
                  ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
                  : 'bg-cream-100 text-muted-foreground hover:bg-cream-200'}
              `}
            >
              {hasSelection
                ? safeT('modelsModalConfirm', 'Готово')
                : safeT('modelsModalSkip', 'Закрыть')}
              {hasSelection && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
