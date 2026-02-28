'use client'

import { useState } from 'react'
import { Sparkles, Lock, Check } from 'lucide-react'
import { MODEL_PHOTOS, MODEL_PHOTO_MAP, type ModelCategory } from '@/lib/constants'

type TabCategory = 'all' | ModelCategory

/** Maps model_id → jewelry category. Used by dashboard page to get templateCategory. */
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
  selectedId: string | null
  onSelect:   (id: string) => void
}

export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  const [activeTab, setActiveTab] = useState<TabCategory>('all')

  const filtered =
    activeTab === 'all'
      ? MODEL_PHOTOS
      : MODEL_PHOTOS.filter((m) => m.category === activeTab)

  const handleAIPick = () => {
    const pool = filtered.filter((m) => !m.premium)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (pick) onSelect(pick.id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI Pick button */}
      <button
        onClick={handleAIPick}
        className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-rose-gold-300 bg-rose-gold-50 text-rose-gold-700 text-sm font-semibold hover:bg-rose-gold-100 hover:border-rose-gold-400 transition-all duration-200 group"
      >
        <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Пусть ИИ выберет модель
      </button>

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
      <div className="grid grid-cols-3 gap-2.5 overflow-y-auto min-h-[280px] flex-1 pr-0.5">
        {filtered.map((model) => {
          const isSelected = selectedId === model.id

          return (
            <button
              key={model.id}
              onClick={() => !model.premium && onSelect(model.id)}
              disabled={model.premium}
              className={`
                relative group rounded-xl overflow-hidden border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary shadow-glow scale-[0.97]'
                  : model.premium
                  ? 'border-cream-200 opacity-70 cursor-not-allowed'
                  : 'border-transparent hover:border-rose-gold-200 hover:shadow-soft'
                }
              `}
            >
              {/* Model photo — 9:16 aspect ratio */}
              <div className="aspect-[9/16] relative overflow-hidden bg-cream-100">
                <img
                  src={`/models/${model.filename}`}
                  alt={model.name}
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                />
              </div>

              {/* Selected overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <Check className="w-4 h-4 text-white" />
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

      {/* Premium upgrade note */}
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        <Lock className="w-3 h-3 inline mr-1" />
        Премиум-модели доступны на тарифе{' '}
        <a href="/settings/billing" className="text-primary underline-offset-2 hover:underline">
          Бренд Бизнес
        </a>
      </p>
    </div>
  )
}

// Re-export for consumers that need to look up a model by id
export { MODEL_PHOTO_MAP }
