'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { Sparkles, Lock, Check, Upload, X, Wand2 } from 'lucide-react'
import {
  type CardTemplate,
  MAX_CARD_TEMPLATES,
  CUSTOM_CARD_TEMPLATE_ID,
  AI_FREE_CARD_ID,
} from '@/lib/card-templates'
import { canAccessPremiumTemplates, isPremiumTemplateLocked } from '@/lib/config/plans'
import type { Plan } from '@/types/database.types'

interface CardTemplatePickerProps {
  templates:               CardTemplate[]
  selectedIds:             string[]
  onSelect:                (ids: string[]) => void
  maxSelect?:              number
  disabled?:               boolean
  currentPlan?:            Plan | null
  customTemplateUrl:       string | null
  onCustomTemplateChange:  (file: File | null, url: string | null) => void
}

export function CardTemplatePicker({
  templates,
  selectedIds,
  onSelect,
  maxSelect = MAX_CARD_TEMPLATES,
  disabled = false,
  currentPlan = 'free',
  customTemplateUrl,
  onCustomTemplateChange,
}: CardTemplatePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const locale = useLocale() === 'ru' ? 'ru' : 'en'
  const premiumUnlocked = canAccessPremiumTemplates(currentPlan)
  const copy = locale === 'ru'
    ? {
        aiPick: 'Пусть ИИ выберет',
        ofMax: `из ${maxSelect}`,
        customAlt: 'Мой шаблон',
        uploadTemplate: 'Загрузить свой шаблон',
        myBadge: 'Мой',
        myTemplate: 'Мой шаблон',
        ownTemplate: 'Свой шаблон',
        aiCreates: 'ИИ создаёт',
        withoutTemplate: 'без шаблона',
        freeGeneration: 'Свободная генерация',
        premiumNote: 'Премиум на тарифе',
        premiumPlan: 'Про',
        reset: 'Сбросить',
      }
    : {
        aiPick: 'Let AI pick',
        ofMax: `of ${maxSelect}`,
        customAlt: 'My template',
        uploadTemplate: 'Upload your template',
        myBadge: 'Mine',
        myTemplate: 'My template',
        ownTemplate: 'Your template',
        aiCreates: 'AI creates',
        withoutTemplate: 'without template',
        freeGeneration: 'Free generation',
        premiumNote: 'Premium on',
        premiumPlan: 'Pro',
        reset: 'Reset',
      }

  const atMax    = selectedIds.length >= maxSelect
  const filtered = templates

  useEffect(() => {
    const nextSelected = selectedIds.filter((id) => {
      if (id === CUSTOM_CARD_TEMPLATE_ID || id === AI_FREE_CARD_ID) return true
      const template = templates.find((item) => item.id === id)
      return !isPremiumTemplateLocked(currentPlan, template?.premium)
    })

    if (nextSelected.length !== selectedIds.length) {
      onSelect(nextSelected)
    }
  }, [currentPlan, onSelect, selectedIds, templates])

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
    const pool     = templates.filter((t) => !isPremiumTemplateLocked(currentPlan, t.premium))
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const picks    = shuffled.slice(0, Math.min(2, maxSelect)).map((t) => t.id)
    onSelect(picks)
  }

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const url = URL.createObjectURL(file)
    onCustomTemplateChange(file, url)

    if (!selectedIds.includes(CUSTOM_CARD_TEMPLATE_ID) && selectedIds.length < maxSelect) {
      onSelect([CUSTOM_CARD_TEMPLATE_ID, ...selectedIds])
    }
  }

  const handleRemoveCustom = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCustomTemplateChange(null, null)
    onSelect(selectedIds.filter((s) => s !== CUSTOM_CARD_TEMPLATE_ID))
  }

  const customSelected  = selectedIds.includes(CUSTOM_CARD_TEMPLATE_ID)
  const customDisabled  = disabled || (atMax && !customSelected && !customTemplateUrl)

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleCustomUpload}
      />

      {/* AI Pick + counter */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleAIPick}
        disabled={disabled}
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-rose-gold-300 bg-rose-gold-50 text-rose-gold-700 text-sm font-semibold hover:bg-rose-gold-100 hover:border-rose-gold-400 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
      >
        <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
        {copy.aiPick}
      </button>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1.5 bg-cream-100 border border-cream-200 rounded-xl px-3 py-2 text-xs font-semibold text-foreground whitespace-nowrap">
            <span className="w-4 h-4 rounded-full gradient-rose-gold flex items-center justify-center text-white text-[9px] font-bold">
              {selectedIds.length}
            </span>
            {copy.ofMax}
          </div>
        )}
      </div>


      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto min-h-[280px] flex-1 pr-0.5">

        {/* ── Custom template card ────────────────────────────────────────── */}
        <button
          onClick={() =>
            customTemplateUrl ? toggle(CUSTOM_CARD_TEMPLATE_ID) : fileInputRef.current?.click()
          }
          disabled={customDisabled}
          className={`
            relative group rounded-xl overflow-hidden border-2 transition-all duration-200
            ${customSelected
              ? 'border-primary shadow-glow scale-[0.97]'
              : customTemplateUrl
              ? 'border-rose-gold-300 hover:border-primary hover:shadow-soft'
              : 'border-dashed border-rose-gold-200 hover:border-rose-gold-400'
            }
            ${customDisabled && !customSelected ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-rose-gold-50 to-cream-100">
            {customTemplateUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customTemplateUrl}
                alt={copy.customAlt}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-dashed border-rose-gold-300 flex items-center justify-center group-hover:border-rose-gold-500 transition-colors">
                  <Upload className="w-4 h-4 text-rose-gold-400 group-hover:text-rose-gold-600 transition-colors" />
                </div>
                <p className="text-[10px] font-semibold text-rose-gold-600 text-center leading-snug">
                  {copy.uploadTemplate}
                </p>
              </div>
            )}
          </div>

          {customSelected && (
            <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                <span className="text-white text-[10px] font-bold">
                  {selectedIds.indexOf(CUSTOM_CARD_TEMPLATE_ID) + 1}
                </span>
              </div>
            </div>
          )}

          {customTemplateUrl && !disabled && (
            <>
              <div className="absolute top-1.5 left-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wide bg-primary text-white px-1.5 py-0.5 rounded-full shadow-sm">
                  {copy.myBadge}
                </span>
              </div>
              <button
                onClick={handleRemoveCustom}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-1.5 py-2">
            <p className="text-[9px] font-medium text-white text-center leading-tight">
              {customTemplateUrl ? copy.myTemplate : copy.ownTemplate}
            </p>
          </div>
        </button>

        {/* ── AI Free card ────────────────────────────────────────────────── */}
        {(() => {
          const isSelected = selectedIds.includes(AI_FREE_CARD_ID)
          const isDisabled = disabled || (atMax && !isSelected)
          const selIdx     = selectedIds.indexOf(AI_FREE_CARD_ID)
          return (
            <button
              onClick={() => !isDisabled && toggle(AI_FREE_CARD_ID)}
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
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-violet-100 via-rose-gold-50 to-amber-50">
                {/* Animated shimmer */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-rose-gold-300/20 to-amber-300/10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 ${isSelected ? 'gradient-rose-gold scale-110' : 'bg-white/80 group-hover:scale-110'}`}>
                    <Wand2 className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-violet-500 group-hover:text-rose-gold-600'} transition-colors`} />
                  </div>
                  <p className="text-[10px] font-bold text-center leading-snug text-violet-700 group-hover:text-rose-gold-700 transition-colors">
                    {copy.aiCreates}<br />{copy.withoutTemplate}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-primary/10 flex items-start justify-end p-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <span className="text-white text-[10px] font-bold">{selIdx + 1}</span>
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

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-1.5 py-2">
                <p className="text-[9px] font-medium text-white text-center leading-tight">
                  {copy.freeGeneration}
                </p>
              </div>
            </button>
          )
        })()}

        {/* ── Preset template cards ───────────────────────────────────────── */}
        {filtered.map((template) => {
          const premiumLocked = isPremiumTemplateLocked(currentPlan, template.premium)
          const isSelected = selectedIds.includes(template.id)
          const isDisabled = premiumLocked || disabled || (atMax && !isSelected)
          const selIdx     = selectedIds.indexOf(template.id)

          return (
            <button
              key={template.id}
              onClick={() => !premiumLocked && toggle(template.id)}
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
              {/* Template image preview */}
              <div className="aspect-square relative overflow-hidden bg-cream-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.imageUrl}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-primary/15 flex items-start justify-end p-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-soft">
                    <span className="text-white text-[10px] font-bold">{selIdx + 1}</span>
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

              {premiumLocked && (
                <div className="absolute inset-0 bg-cream-100/50 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center shadow-soft">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              )}

              {template.label && !premiumLocked && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-white/90 text-rose-gold-600 px-1.5 py-0.5 rounded-full shadow-sm">
                    {template.label}
                  </span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-1.5 py-2">
                <p className="text-[9px] font-medium text-white text-center leading-tight truncate">
                  {template.name}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {!premiumUnlocked ? (
          <p className="text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3 inline mr-1" />
            {copy.premiumNote}{' '}
            <a
              href={locale === 'ru' ? '/ru/settings/billing' : '/settings/billing'}
              className="text-primary underline-offset-2 hover:underline"
            >
              {copy.premiumPlan}
            </a>
          </p>
        ) : (
          <span />
        )}
        {selectedIds.length > 0 && (
          <button
            onClick={() => onSelect([])}
            disabled={disabled}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 py-1 px-2 -mr-1 touch-manipulation"
          >
            {copy.reset}
          </button>
        )}
      </div>
    </div>
  )
}
