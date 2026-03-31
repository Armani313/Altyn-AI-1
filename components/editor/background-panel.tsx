'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ImagePlus } from 'lucide-react'

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

const SOLID_PRESETS = [
  '#ffffff', '#f5f5f5', '#1a1a1a', '#000000',
  '#C4834F', '#e8d5c4', '#dbeafe', '#dcfce7',
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
      <div className="grid grid-cols-4 gap-1.5">
        {(['transparent', 'color', 'gradient', 'image'] as BgType[]).map((bgType) => (
          <button
            key={bgType}
            onClick={() => setType(bgType)}
            className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
              config.type === bgType
                ? 'bg-rose-gold-100 text-rose-gold-700 border border-rose-gold-200'
                : 'bg-cream-100 text-muted-foreground hover:bg-cream-200'
            }`}
          >
            {bgType === 'transparent' ? t('bgTransparent')
              : bgType === 'color' ? t('bgColor')
              : bgType === 'gradient' ? t('bgGradient')
              : t('bgPhoto')}
          </button>
        ))}
      </div>

      {config.type === 'color' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {SOLID_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-lg border-2 transition-all ${
                  config.color === c ? 'border-rose-gold-500 scale-110' : 'border-transparent hover:border-cream-400'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-cream-200"
            />
            <span className="text-xs text-muted-foreground">{config.color}</span>
          </div>
        </div>
      )}

      {config.type === 'gradient' && (
        <div className="flex flex-wrap gap-1.5">
          {GRADIENT_PRESETS.map((g) => (
            <button
              key={g.label}
              onClick={() => setGradient(g)}
              title={gradientName(g.label)}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                config.gradient.label === g.label
                  ? 'border-rose-gold-500 scale-110'
                  : 'border-transparent hover:border-cream-400'
              }`}
              style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
            />
          ))}
        </div>
      )}

      {config.type === 'image' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <div className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
            bgImageFile ? 'border-rose-gold-200 bg-rose-gold-50' : 'border-cream-300 bg-cream-100'
          }`}>
            <ImagePlus className="w-3.5 h-3.5 text-rose-gold-500 flex-shrink-0" />
            <span className="truncate text-muted-foreground">
              {bgImageFile ? bgImageFile.name : t('selectBgPhoto')}
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgImageUpload(f) }}
          />
        </label>
      )}
    </>
  )
}
