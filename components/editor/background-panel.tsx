'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ImagePlus, Check } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BgType = 'transparent' | 'color' | 'gradient' | 'image'

export interface GradientPreset {
  label: string
  from: string
  to: string
}

export interface BgConfig {
  type: BgType
  color: string
  gradient: GradientPreset
  imageUrl: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const GRADIENT_PRESETS: GradientPreset[] = [
  { label: 'dawn',     from: '#ffecd2', to: '#fcb69f' },
  { label: 'sky',      from: '#a1c4fd', to: '#c2e9fb' },
  { label: 'lavender', from: '#e0c3fc', to: '#8ec5fc' },
  { label: 'night',    from: '#1a1a2e', to: '#16213e' },
  { label: 'mint',     from: '#84fab0', to: '#8fd3f4' },
  { label: 'gold',     from: '#f6d365', to: '#fda085' },
  { label: 'rose',     from: '#fbc2eb', to: '#a6c1ee' },
  { label: 'marble',   from: '#e8e8e8', to: '#f5f5f5' },
]

const SOLID_PRESETS: { color: string; label: string }[] = [
  { color: '#ffffff', label: 'White' },
  { color: '#f5f5f5', label: 'Light Gray' },
  { color: '#FAF7F4', label: 'Cream' },
  { color: '#1a1a1a', label: 'Charcoal' },
  { color: '#000000', label: 'Black' },
  { color: '#C4834F', label: 'Rose Gold' },
  { color: '#e8d5c4', label: 'Beige' },
  { color: '#dbeafe', label: 'Sky' },
  { color: '#dcfce7', label: 'Mint' },
  { color: '#fce7f3', label: 'Rose' },
]

export const DEFAULT_BG_CONFIG: BgConfig = {
  type: 'color',
  color: '#ffffff',
  gradient: GRADIENT_PRESETS[0],
  imageUrl: null,
}

// ─── Component ────────────────────────────────────────────────────────────────

interface BackgroundPanelProps {
  config: BgConfig
  onChange: (config: BgConfig) => void
}

export function BackgroundPanel({ config, onChange }: BackgroundPanelProps) {
  const t = useTranslations('editor')
  const [bgImageFile, setBgImageFile] = useState<File | null>(null)
  const bgUrlRef = useRef<string | null>(null)

  useEffect(() => () => {
    if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current)
  }, [])

  const gradientName = (key: string): string => {
    const map: Record<string, string> = {
      dawn: t('gradientDawn'), sky: t('gradientSky'), lavender: t('gradientLavender'),
      night: t('gradientNight'), mint: t('gradientMint'), gold: t('gradientGold'),
      rose: t('gradientRose'), marble: t('gradientMarble'),
    }
    return map[key] ?? key
  }

  const setType = (type: BgType) => onChange({ ...config, type })
  const setColor = (color: string) => onChange({ ...config, type: 'color', color })
  const setGradient = (gradient: GradientPreset) => onChange({ ...config, type: 'gradient', gradient })

  const handleBgImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (bgUrlRef.current) URL.revokeObjectURL(bgUrlRef.current)
    const url = URL.createObjectURL(file)
    bgUrlRef.current = url
    setBgImageFile(file)
    onChange({ ...config, type: 'image', imageUrl: url })
  }, [config, onChange])

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
        {t('background')}
      </p>

      {/* Type tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-cream-100 rounded-xl">
        {(['transparent', 'color', 'gradient', 'image'] as BgType[]).map((bgType) => (
          <button
            key={bgType}
            onClick={() => setType(bgType)}
            className={`py-2 rounded-lg text-[11px] font-medium transition-all ${
              config.type === bgType
                ? 'bg-white text-rose-gold-700 shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {bgType === 'transparent' ? t('bgTransparent')
              : bgType === 'color' ? t('bgColor')
              : bgType === 'gradient' ? t('bgGradient')
              : t('bgPhoto')}
          </button>
        ))}
      </div>

      {/* Color presets */}
      {config.type === 'color' && (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-1.5">
            {SOLID_PRESETS.map(({ color, label }) => {
              const isActive = config.color.toLowerCase() === color.toLowerCase()
              return (
                <button
                  key={color}
                  onClick={() => setColor(color)}
                  title={label}
                  className={`relative aspect-square rounded-lg border transition-all ${
                    isActive
                      ? 'border-rose-gold-500 ring-2 ring-rose-gold-200 scale-105'
                      : 'border-cream-200 hover:border-cream-400 hover:scale-105'
                  }`}
                  style={{ background: color }}
                >
                  {isActive && (
                    <Check
                      className={`w-3.5 h-3.5 absolute inset-0 m-auto ${
                        ['#ffffff', '#f5f5f5', '#FAF7F4', '#e8d5c4', '#dbeafe', '#dcfce7', '#fce7f3'].includes(color)
                          ? 'text-rose-gold-600'
                          : 'text-white'
                      }`}
                      strokeWidth={3}
                    />
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 px-1">
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={config.color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div
                className="w-9 h-9 rounded-lg border-2 border-cream-200 hover:border-rose-gold-300 transition-colors"
                style={{ background: config.color }}
              />
            </label>
            <span className="text-xs text-muted-foreground font-mono uppercase">{config.color}</span>
          </div>
        </div>
      )}

      {/* Gradient presets */}
      {config.type === 'gradient' && (
        <div className="grid grid-cols-4 gap-1.5">
          {GRADIENT_PRESETS.map((g) => {
            const isActive = config.gradient.label === g.label
            return (
              <button
                key={g.label}
                onClick={() => setGradient(g)}
                title={gradientName(g.label)}
                className={`relative aspect-square rounded-lg border transition-all ${
                  isActive
                    ? 'border-rose-gold-500 ring-2 ring-rose-gold-200 scale-105'
                    : 'border-cream-200 hover:border-cream-400 hover:scale-105'
                }`}
                style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
              >
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow" strokeWidth={3} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Image upload */}
      {config.type === 'image' && (
        <div className="space-y-2">
          <label className="block cursor-pointer">
            <div
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-4 transition-colors ${
                bgImageFile
                  ? 'border-rose-gold-200 bg-rose-gold-50/60'
                  : 'border-cream-300 bg-cream-50 hover:border-rose-gold-300 hover:bg-rose-gold-50/30'
              }`}
            >
              <ImagePlus className="w-5 h-5 text-rose-gold-500" />
              <span className="text-xs font-medium text-foreground text-center">
                {bgImageFile ? bgImageFile.name : t('selectBgPhoto')}
              </span>
              {bgImageFile && (
                <span className="text-[10px] text-muted-foreground">
                  {(bgImageFile.size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgImageUpload(f) }}
            />
          </label>
        </div>
      )}
    </>
  )
}
