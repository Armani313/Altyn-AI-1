'use client'

import { useState } from 'react'
import { Sparkles, Lock, Check } from 'lucide-react'

type Category = 'all' | 'rings' | 'necklaces' | 'earrings'

interface Template {
  id: string
  name: string
  category: Exclude<Category, 'all'>
  gradient: string
  label?: string
  premium?: boolean
}

const TEMPLATES: Template[] = [
  { id: 'hand-1', name: 'Изящная рука',    category: 'rings',     gradient: 'from-[#F5D5C0] to-[#D49A6A]', label: 'Хит' },
  { id: 'hand-2', name: 'Длинные пальцы',  category: 'rings',     gradient: 'from-[#EAC9A8] to-[#C48860]' },
  { id: 'hand-3', name: 'Нежный жест',     category: 'rings',     gradient: 'from-[#F0D8C0] to-[#D4A070]', label: 'Новый' },
  { id: 'hand-4', name: 'Обе руки',        category: 'rings',     gradient: 'from-[#E8C8A0] to-[#C89060]', premium: true },
  { id: 'neck-1', name: 'Декольте',        category: 'necklaces', gradient: 'from-[#E8B8A0] to-[#C88068]', label: 'Хит' },
  { id: 'neck-2', name: 'Ключица',         category: 'necklaces', gradient: 'from-[#D8B090] to-[#B87858]' },
  { id: 'neck-3', name: 'Элегантная шея',  category: 'necklaces', gradient: 'from-[#ECC8A0] to-[#D09060]', premium: true },
  { id: 'ear-1',  name: 'Профиль',         category: 'earrings',  gradient: 'from-[#F0D0B0] to-[#E0A870]' },
  { id: 'ear-2',  name: 'Крупный план',    category: 'earrings',  gradient: 'from-[#E8C8A8] to-[#D8A068]', label: 'Новый' },
]

const TABS: { id: Category; label: string }[] = [
  { id: 'all',       label: 'Все' },
  { id: 'rings',     label: 'Руки' },
  { id: 'necklaces', label: 'Шея' },
  { id: 'earrings',  label: 'Уши' },
]

interface TemplatePickerProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  const [activeTab, setActiveTab] = useState<Category>('all')

  const filtered =
    activeTab === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeTab)

  const handleAIPick = () => {
    const pool = filtered.filter((t) => !t.premium)
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
        Пусть ИИ выберет позу
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

      {/* Templates grid */}
      <div className="grid grid-cols-3 gap-2.5 overflow-y-auto flex-1 pr-0.5">
        {filtered.map((template) => {
          const isSelected = selectedId === template.id

          return (
            <button
              key={template.id}
              onClick={() => !template.premium && onSelect(template.id)}
              disabled={template.premium}
              className={`
                relative group rounded-xl overflow-hidden border-2 transition-all duration-200
                ${isSelected
                  ? 'border-primary shadow-glow scale-[0.97]'
                  : template.premium
                  ? 'border-cream-200 opacity-70 cursor-not-allowed'
                  : 'border-transparent hover:border-rose-gold-200 hover:shadow-soft'
                }
              `}
            >
              {/* Thumbnail */}
              <div
                className={`aspect-square bg-gradient-to-br ${template.gradient} flex items-center justify-center`}
              >
                {/* Abstract hand/model silhouette */}
                <div className="w-6 h-10 bg-white/25 rounded-full" />
              </div>

              {/* Selected overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}

              {/* Premium lock */}
              {template.premium && (
                <div className="absolute inset-0 bg-cream-100/60 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-cream-200 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Label badge */}
              {template.label && !template.premium && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-white/90 text-rose-gold-600 px-1.5 py-0.5 rounded-full">
                    {template.label}
                  </span>
                </div>
              )}

              {/* Name */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-1.5">
                <p className="text-[10px] font-medium text-white text-center leading-tight truncate">
                  {template.name}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Upgrade note for premium */}
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        <Lock className="w-3 h-3 inline mr-1" />
        Премиум-позы доступны на тарифе{' '}
        <a href="/settings/billing" className="text-primary underline-offset-2 hover:underline">
          Бренд Бизнес
        </a>
      </p>
    </div>
  )
}
