'use client'

import { useState } from 'react'
import { Sparkles, Lock, Check } from 'lucide-react'
import { MODEL_PHOTOS, MODEL_PHOTO_MAP, type ModelCategory } from '@/lib/constants'

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
  selectedIds: string[]
  onSelect:    (ids: string[]) => void
  maxSelect?:  number
  disabled?:   boolean
}

export function TemplatePicker({
  selectedIds,
  onSelect,
  maxSelect = 4,
  disabled = false,
}: TemplatePickerProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>('all')

  const filtered =
    activeTab === 'all'
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

  const atMax = selectedIds.length >= maxSelect

  return (
    <div className="flex flex-col h-full">
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

      {/* Filter tabs */}
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

      {/* Model photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto min-h-[280px] flex-1 pr-0.5">
        {filtered.map((model) => {
          const isSelected = selectedIds.includes(model.id)
          const isDisabled = model.premium || disabled || (atMax && !isSelected)
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
              {/* Model photo */}
              <div className="aspect-[9/16] relative overflow-hidden bg-cream-100">
                <img
                  src={`/models/${model.filename}`}
                  alt={model.name}
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                  loading="lazy"
                />
              </div>

              {/* Selected overlay with order number */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <span className="text-white text-[10px] font-bold">
                      {selectionIndex + 1}
                    </span>
                  </div>
                </div>
              )}

              {/* Check badge bottom-left when selected */}
              {isSelected && (
                <div className="absolute bottom-7 left-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Premium lock overlay */}
              {model.premium && (
                <div className="absolute inset-0 bg-cream-100/50 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center shadow-soft">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Label badge */}
              {model.label && !model.premium && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-white/90 text-rose-gold-600 px-1.5 py-0.5 rounded-full shadow-sm">
                    {model.label}
                  </span>
                </div>
              )}

              {/* Model name */}
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

// Re-export for consumers that need to look up a model by id
export { MODEL_PHOTO_MAP }
