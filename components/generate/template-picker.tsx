'use client'

import { useState, useRef } from 'react'
import { Sparkles, Lock, Check, Upload, Loader2, User, RefreshCw } from 'lucide-react'
import { MODEL_PHOTOS, MODEL_PHOTO_MAP, CUSTOM_MODEL_ID, type ModelCategory, type ProductType } from '@/lib/constants'

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
  selectedIds:           string[]
  onSelect:              (ids: string[]) => void
  maxSelect?:            number
  disabled?:             boolean
  productType?:          ProductType
  customModelUrl?:       string | null
  onCustomModelChange?:  (url: string | null) => void
}

export function TemplatePicker({
  selectedIds,
  onSelect,
  maxSelect = 4,
  disabled = false,
  productType = 'jewelry',
  customModelUrl = null,
  onCustomModelChange,
}: TemplatePickerProps) {
  const [activeTab,       setActiveTab]       = useState<TabCategory>('all')
  const [isUploading,     setIsUploading]     = useState(false)
  const [uploadError,     setUploadError]     = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isScarves   = productType === 'scarves'
  const isCustomSel = selectedIds.includes(CUSTOM_MODEL_ID)
  const atMax       = selectedIds.length >= maxSelect

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

  const handleUploadClick = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    setIsUploading(true)
    setUploadError(null)

    try {
      const fd = new FormData()
      fd.append('image', file)

      const res  = await fetch('/api/models/upload', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error ?? 'Ошибка загрузки')
        return
      }

      onCustomModelChange?.(data.url)

      // Auto-select the custom model after upload
      if (!selectedIds.includes(CUSTOM_MODEL_ID) && selectedIds.length < maxSelect) {
        onSelect([CUSTOM_MODEL_ID, ...selectedIds])
      }
    } catch {
      setUploadError('Ошибка соединения. Попробуйте снова.')
    } finally {
      setIsUploading(false)
    }
  }

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

        {/* ── Custom model card (always first) ─────────────────────────── */}
        <button
          onClick={customModelUrl ? () => toggle(CUSTOM_MODEL_ID) : handleUploadClick}
          disabled={isUploading || disabled || (!customModelUrl && false) || (atMax && !isCustomSel)}
          className={`
            relative group rounded-xl overflow-hidden border-2 transition-all duration-200
            ${isCustomSel
              ? 'border-primary shadow-glow scale-[0.97]'
              : customModelUrl
              ? 'border-rose-gold-300 hover:border-primary hover:shadow-soft'
              : 'border-dashed border-rose-gold-200 hover:border-rose-gold-400 hover:bg-rose-gold-50/50'
            }
            ${(atMax && !isCustomSel) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="aspect-[9/16] relative overflow-hidden bg-gradient-to-br from-rose-gold-50 to-cream-100">
            {isUploading ? (
              /* Upload in progress */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-rose-gold-400 animate-spin" />
                <p className="text-[10px] text-rose-gold-600 font-medium px-2 text-center">
                  Загрузка…
                </p>
              </div>
            ) : customModelUrl ? (
              /* Existing custom model photo */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customModelUrl}
                alt="Ваша модель"
                className="w-full h-full object-cover object-top"
                draggable={false}
                loading="lazy"
              />
            ) : (
              /* Upload prompt */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-rose-gold-300 flex items-center justify-center group-hover:border-rose-gold-500 transition-colors">
                  <Upload className="w-4 h-4 text-rose-gold-400 group-hover:text-rose-gold-600 transition-colors" />
                </div>
                <p className="text-[10px] font-semibold text-rose-gold-600 text-center leading-snug">
                  Загрузить свою модель
                </p>
              </div>
            )}
          </div>

          {/* Selected order badge */}
          {isCustomSel && (
            <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                <span className="text-white text-[10px] font-bold">
                  {selectedIds.indexOf(CUSTOM_MODEL_ID) + 1}
                </span>
              </div>
            </div>
          )}

          {/* "Ваша модель" label */}
          {customModelUrl && (
            <div className="absolute top-1.5 left-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wide bg-primary text-white px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                Моя
              </span>
            </div>
          )}

          {/* Re-upload button — appears on hover when model exists */}
          {customModelUrl && !isUploading && !disabled && (
            <button
              onClick={(e) => { e.stopPropagation(); handleUploadClick() }}
              className="absolute bottom-7 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Заменить фото"
            >
              <RefreshCw className="w-3 h-3 text-white" />
            </button>
          )}

          {/* Bottom name bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-1.5 py-2">
            <p className="text-[9px] font-medium text-white text-center leading-tight">
              {customModelUrl ? 'Ваша модель' : 'Своя модель'}
            </p>
          </div>
        </button>

        {/* ── Regular model cards ───────────────────────────────────────── */}
        {filtered.map((model) => {
          const isSelected    = selectedIds.includes(model.id)
          const isDisabled    = model.premium || disabled || (atMax && !isSelected)
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
                    <span className="text-white text-[10px] font-bold">
                      {selectionIndex + 1}
                    </span>
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
