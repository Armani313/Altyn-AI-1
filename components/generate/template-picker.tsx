'use client'

import { useState, useRef } from 'react'
import { Sparkles, Lock, Check, Upload, Loader2, User, X, ScanLine } from 'lucide-react'
import {
  MODEL_PHOTOS, MODEL_PHOTO_MAP, type ModelCategory, type ProductType,
  MAX_CUSTOM_MODELS, makeCustomModelId, isCustomModelId,
  MACRO_SHOT_ID, isMacroShotId,
} from '@/lib/constants'

type TabCategory = 'all' | ModelCategory

/** Maps model_id → jewelry category. Used by dashboard page. */
export const TEMPLATE_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  MODEL_PHOTOS.map((m) => [m.id, m.category])
)

const TABS: { id: TabCategory; label: string }[] = [
  { id: 'all',       label: 'Все'    },
  { id: 'necklaces', label: 'Колье'  },
  { id: 'earrings',  label: 'Серьги' },
  { id: 'rings',     label: 'Кольца' },
]

interface TemplatePickerProps {
  selectedIds:              string[]
  onSelect:                 (ids: string[]) => void
  maxSelect?:               number
  disabled?:                boolean
  productType?:             ProductType
  customModelUrls:          string[]
  onCustomModelUrlsChange:  (urls: string[]) => void
}

export function TemplatePicker({
  selectedIds,
  onSelect,
  maxSelect = 4,
  disabled = false,
  productType = 'jewelry',
  customModelUrls,
  onCustomModelUrlsChange,
}: TemplatePickerProps) {
  const [activeTab,    setActiveTab]    = useState<TabCategory>('all')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [deletingIdx,  setDeletingIdx]  = useState<number | null>(null)
  const [uploadError,  setUploadError]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<'new' | number>('new')

  const isScarves = productType === 'scarves'
  const atMax     = selectedIds.length >= maxSelect

  const filtered = isScarves
    ? MODEL_PHOTOS
    : activeTab === 'all'
      ? MODEL_PHOTOS
      : MODEL_PHOTOS.filter((m) => m.category === activeTab)

  const toggle = (id: string) => {
    if (disabled) return
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((s) => s !== id))
    } else if (selectedIds.length < maxSelect) {
      onSelect([...selectedIds, id])
    }
  }

  const handleAIPick = () => {
    if (disabled) return
    const pool = MODEL_PHOTOS.filter((m) => !m.premium)
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const picks = shuffled.slice(0, Math.min(3, maxSelect)).map((m) => m.id)
    onSelect(picks)
  }

  // Open file picker — either for a new slot or to replace an existing one
  const openFilePicker = (target: 'new' | number) => {
    if (disabled || uploadingIdx !== null) return
    uploadTargetRef.current = target
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const target = uploadTargetRef.current
    const slotIndex = target === 'new' ? customModelUrls.length : target

    setUploadingIdx(slotIndex)
    setUploadError(null)

    try {
      // If replacing an existing slot — delete old one first
      if (target !== 'new' && customModelUrls[target] !== undefined) {
        const delRes = await fetch('/api/models/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: target }),
        })
        if (!delRes.ok) {
          const delData = await delRes.json()
          setUploadError(delData.error ?? 'Ошибка замены модели')
          return
        }
        const delData = await delRes.json()
        // Update URL list locally after deletion (before upload)
        onCustomModelUrlsChange(delData.urls)
        // Deselect the old ID for this slot
        const oldId = makeCustomModelId(target)
        if (selectedIds.includes(oldId)) {
          onSelect(selectedIds.filter((s) => s !== oldId))
        }
      }

      const fd = new FormData()
      fd.append('image', file)

      const res  = await fetch('/api/models/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? 'Ошибка загрузки')
        return
      }

      onCustomModelUrlsChange(data.urls)

      // Auto-select the new slot if there's room
      const newId = makeCustomModelId(data.index)
      if (!selectedIds.includes(newId) && selectedIds.length < maxSelect) {
        onSelect([newId, ...selectedIds.filter((s) => !isCustomModelId(s) || s !== newId)])
      }
    } catch {
      setUploadError('Ошибка соединения. Попробуйте снова.')
    } finally {
      setUploadingIdx(null)
    }
  }

  const handleDelete = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || deletingIdx !== null) return

    setDeletingIdx(index)
    try {
      const res  = await fetch('/api/models/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error ?? 'Ошибка удаления')
        return
      }
      onCustomModelUrlsChange(data.urls)
      // Deselect the removed model
      const removedId = makeCustomModelId(index)
      // After deletion, the IDs of models after `index` shift down
      // Rebuild selected custom IDs based on new array
      const newCustomSelected = selectedIds
        .filter((s) => isCustomModelId(s))
        .map((s) => {
          const i = parseInt(s.replace('user-custom-', ''), 10)
          if (i === index) return null         // deleted
          if (i > index)   return makeCustomModelId(i - 1) // shifted
          return s
        })
        .filter(Boolean) as string[]
      const staticSelected = selectedIds.filter((s) => !isCustomModelId(s))
      onSelect([...newCustomSelected, ...staticSelected])
      void removedId
    } catch {
      setUploadError('Ошибка соединения.')
    } finally {
      setDeletingIdx(null)
    }
  }

  // How many custom cards to show: all existing + one "add" slot (if < max)
  const customCardCount = Math.min(customModelUrls.length + 1, MAX_CUSTOM_MODELS)

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* AI Pick + selection counter */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleAIPick}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-rose-gold-300 bg-rose-gold-50 text-rose-gold-700 text-sm font-semibold hover:bg-rose-gold-100 hover:border-rose-gold-400 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Пусть ИИ выберет
        </button>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1.5 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-xs font-semibold text-foreground whitespace-nowrap">
            <span className="w-4 h-4 rounded-full gradient-rose-gold flex items-center justify-center text-white text-[9px] font-bold">
              {selectedIds.length}
            </span>
            из {maxSelect}
          </div>
        )}
      </div>

      {/* Filter tabs — only for jewelry mode */}
      {!isScarves && (
        <div className="flex gap-1 p-1 bg-cream-100 rounded-xl mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Scarves hint */}
      {isScarves && (
        <div className="mb-4 px-3 py-2 bg-rose-gold-50 border border-rose-gold-100 rounded-xl">
          <p className="text-xs text-rose-gold-700 text-center leading-snug">
            ИИ задрапирует платок наиболее подходящим образом для каждой модели
          </p>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2 mb-3">
          {uploadError}
        </p>
      )}

      {/* Model grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto min-h-[280px] flex-1 pr-0.5">

        {/* ── Macro shot card (always first) ───────────────────────────── */}
        {(() => {
          const isSelected = selectedIds.includes(MACRO_SHOT_ID)
          const isDisabled = disabled || (atMax && !isSelected)
          return (
            <button
              onClick={() => toggle(MACRO_SHOT_ID)}
              disabled={isDisabled}
              className={`
                relative group rounded-xl overflow-hidden border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary shadow-glow scale-[0.97]'
                  : isDisabled
                  ? 'border-cream-200 opacity-50 cursor-not-allowed'
                  : 'border-transparent hover:border-rose-gold-200 hover:shadow-soft'
                }
              `}
            >
              <div className="aspect-[9/16] relative overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-3 px-3">
                {/* Decorative rings */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-32 h-32 rounded-full border-2 border-white" />
                  <div className="absolute w-20 h-20 rounded-full border border-white" />
                </div>
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                    <ScanLine className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-semibold text-white/90 text-center leading-snug">
                    Макро съёмка
                  </p>
                  <p className="text-[9px] text-white/60 text-center leading-snug">
                    Крупный план товара
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <span className="text-white text-[10px] font-bold">
                      {selectedIds.indexOf(MACRO_SHOT_ID) + 1}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-1.5 py-2">
                <p className="text-[9px] font-medium text-white text-center leading-tight truncate">
                  Макро
                </p>
              </div>
            </button>
          )
        })()}

        {/* ── Custom model cards (always first) ────────────────────────── */}
        {Array.from({ length: customCardCount }).map((_, cardIdx) => {
          const url        = customModelUrls[cardIdx] ?? null
          const modelId    = makeCustomModelId(cardIdx)
          const isSelected = selectedIds.includes(modelId)
          const isLoading  = uploadingIdx === cardIdx
          const isDeleting = deletingIdx  === cardIdx
          const isAddSlot  = url === null   // last card = "add new"
          const isDisabledCard = isLoading || isDeleting || disabled || (atMax && !isSelected && !isAddSlot)

          return (
            <button
              key={`custom-${cardIdx}`}
              onClick={() => isAddSlot ? openFilePicker('new') : toggle(modelId)}
              disabled={isDisabledCard}
              className={`
                relative group rounded-xl overflow-hidden border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary shadow-glow scale-[0.97]'
                  : isAddSlot
                  ? 'border-dashed border-rose-gold-200 hover:border-rose-gold-400 hover:bg-rose-gold-50/50'
                  : 'border-rose-gold-300 hover:border-primary hover:shadow-soft'
                }
                ${isDisabledCard && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="aspect-[9/16] relative overflow-hidden bg-gradient-to-br from-rose-gold-50 to-cream-100">
                {isLoading || isDeleting ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-rose-gold-400 animate-spin" />
                    <p className="text-[10px] text-rose-gold-600 font-medium px-2 text-center">
                      {isDeleting ? 'Удаление…' : 'Загрузка…'}
                    </p>
                  </div>
                ) : url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={`Моя модель ${cardIdx + 1}`}
                    className="w-full h-full object-cover object-top"
                    draggable={false}
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-rose-gold-300 flex items-center justify-center group-hover:border-rose-gold-500 transition-colors">
                      <Upload className="w-4 h-4 text-rose-gold-400 group-hover:text-rose-gold-600 transition-colors" />
                    </div>
                    <p className="text-[10px] font-semibold text-rose-gold-600 text-center leading-snug">
                      Загрузить модель
                    </p>
                  </div>
                )}
              </div>

              {/* Selection badge */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <span className="text-white text-[10px] font-bold">
                      {selectedIds.indexOf(modelId) + 1}
                    </span>
                  </div>
                </div>
              )}

              {/* "Моя" badge */}
              {url && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-primary text-white px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    Моя {customModelUrls.length > 1 ? cardIdx + 1 : ''}
                  </span>
                </div>
              )}

              {/* Delete button — always visible for touch devices */}
              {url && !disabled && !isLoading && !isDeleting && (
                <button
                  onClick={(e) => handleDelete(cardIdx, e)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                  title="Удалить"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              )}

              {/* Replace button — always visible for touch devices */}
              {url && !disabled && !isLoading && !isDeleting && (
                <button
                  onClick={(e) => { e.stopPropagation(); openFilePicker(cardIdx) }}
                  className="absolute bottom-7 right-1.5 text-[8px] font-semibold bg-black/50 hover:bg-black/70 text-white rounded-full px-1.5 py-0.5 transition-colors"
                >
                  Заменить
                </button>
              )}

              {/* Bottom name bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-1.5 py-2">
                <p className="text-[9px] font-medium text-white text-center leading-tight">
                  {url ? `Моя модель${customModelUrls.length > 1 ? ` ${cardIdx + 1}` : ''}` : 'Своя модель'}
                </p>
              </div>
            </button>
          )
        })}

        {/* ── Regular model cards ───────────────────────────────────────── */}
        {filtered.map((model) => {
          const isSelected     = selectedIds.includes(model.id)
          const isDisabled     = model.premium || disabled || (atMax && !isSelected)
          const selectionIndex = selectedIds.indexOf(model.id)

          return (
            <button
              key={model.id}
              onClick={() => !model.premium && toggle(model.id)}
              disabled={isDisabled}
              className={`
                relative group rounded-xl overflow-hidden border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary shadow-glow scale-[0.97]'
                  : isDisabled
                  ? 'border-cream-200 opacity-50 cursor-not-allowed'
                  : 'border-transparent hover:border-rose-gold-200 hover:shadow-soft'
                }
              `}
            >
              <div className="aspect-[9/16] relative overflow-hidden bg-cream-100">
                <img
                  src={`/models/${model.filename}`}
                  alt={model.name}
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                  loading="lazy"
                />
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <span className="text-white text-[10px] font-bold">{selectionIndex + 1}</span>
                  </div>
                </div>
              )}

              {isSelected && (
                <div className="absolute bottom-7 left-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {model.premium && (
                <div className="absolute inset-0 bg-cream-100/50 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center shadow-soft">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              )}

              {model.label && !model.premium && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-white/90 text-rose-gold-600 px-1.5 py-0.5 rounded-full shadow-sm">
                    {model.label}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-1.5 py-2">
                <p className="text-[9px] font-medium text-white text-center leading-tight truncate">
                  {model.name}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3 inline mr-1" />
          Премиум на тарифе{' '}
          <a href="/settings/billing" className="text-primary underline-offset-2 hover:underline">
            Бренд Бизнес
          </a>
        </p>
        {selectedIds.length > 0 && (
          <button
            onClick={() => onSelect([])}
            disabled={disabled}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}

export { MODEL_PHOTO_MAP }
