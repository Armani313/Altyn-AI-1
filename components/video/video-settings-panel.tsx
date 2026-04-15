'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  VIDEO_ASPECT_RATIO_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VIDEO_RESOLUTION_OPTIONS,
  type VideoGenerationSettings,
  type VideoVoiceMode,
} from '@/lib/video/options'

interface VideoSettingsPanelProps {
  value: VideoGenerationSettings
  onChange: (patch: Partial<VideoGenerationSettings>) => void
  disabled?: boolean
  showVoiceMode?: boolean
}

function OptionButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean
  disabled: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role="radio"
      aria-checked={active}
      aria-label={label}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-rose-gold-400 bg-white text-foreground shadow-soft'
          : 'border-cream-200 bg-cream-50 text-muted-foreground hover:border-rose-gold-200 hover:bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {label}
    </button>
  )
}

function SettingGroup({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <div role="radiogroup" aria-label={title} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {children}
      </div>
    </div>
  )
}

export function VideoSettingsPanel({
  value,
  onChange,
  disabled = false,
  showVoiceMode = false,
}: VideoSettingsPanelProps) {
  const t = useTranslations('video')

  const voiceLabel = (mode: VideoVoiceMode) => t(`voiceModeLabels.${mode}`)

  return (
    <div className="mt-4 rounded-2xl border border-cream-200 bg-cream-50 p-3 sm:p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{t('settingsTitle')}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t('settingsHint')}
        </p>
      </div>

      <div className="space-y-4">
        <SettingGroup title={t('formatLabel')} hint={t('formatHint')}>
          {VIDEO_ASPECT_RATIO_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              active={value.aspectRatio === option}
              disabled={disabled}
              label={option}
              onClick={() => onChange({ aspectRatio: option })}
            />
          ))}
        </SettingGroup>

        <SettingGroup title={t('durationLabel')} hint={t('durationHint')}>
          {VIDEO_DURATION_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              active={value.durationSeconds === option}
              disabled={disabled}
              label={`${option}s`}
              onClick={() => onChange({ durationSeconds: option })}
            />
          ))}
        </SettingGroup>

        <SettingGroup title={t('qualityLabel')} hint={t('qualityHint')}>
          {VIDEO_RESOLUTION_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              active={value.resolution === option}
              disabled={disabled}
              label={option}
              onClick={() => onChange({ resolution: option })}
            />
          ))}
        </SettingGroup>

        {showVoiceMode ? (
          <SettingGroup title={t('voiceLabel')} hint={t('voiceHint')}>
            {(['auto', 'ru', 'en', 'kz', 'silent'] as const).map((option) => (
              <OptionButton
                key={option}
                active={value.voiceMode === option}
                disabled={disabled}
                label={voiceLabel(option)}
                onClick={() => onChange({ voiceMode: option })}
              />
            ))}
          </SettingGroup>
        ) : null}
      </div>
    </div>
  )
}
