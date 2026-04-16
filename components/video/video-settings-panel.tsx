'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  VIDEO_ASPECT_RATIO_OPTIONS,
  VIDEO_RESOLUTION_OPTIONS,
  VIDEO_NEGATIVE_PROMPT_MAX_LENGTH,
  calculateVideoCredits,
  type VideoGenerationSettings,
  type VideoResolutionOption,
  type VideoVoiceMode,
} from '@/lib/video/options'

interface VideoSettingsPanelProps {
  value: VideoGenerationSettings
  onChange: (patch: Partial<VideoGenerationSettings>) => void
  disabled?: boolean
  showVoiceMode?: boolean
}

/** Resolutions available for a given aspect ratio. 1080p only works with 16:9. */
function getVisibleResolutions(aspectRatio: VideoGenerationSettings['aspectRatio']): VideoResolutionOption[] {
  return VIDEO_RESOLUTION_OPTIONS.filter((r) => {
    if (r === '1080p' && aspectRatio !== '16:9') return false
    return true
  })
}

function OptionButton({
  active,
  disabled,
  label,
  note,
  onClick,
}: {
  active: boolean
  disabled: boolean
  label: string
  note?: string
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
      {note ? <span className="block text-[10px] font-normal text-muted-foreground/60">{note}</span> : null}
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
      <div role="radiogroup" aria-label={title} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
  const visibleResolutions = getVisibleResolutions(value.aspectRatio)

  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-50 p-3 sm:p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{t('settingsTitle')}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t('settingsHint')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Aspect ratio — always visible, only 9:16 and 16:9 */}
        <SettingGroup title={t('formatLabel')} hint={t('formatHint')}>
          {VIDEO_ASPECT_RATIO_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              active={value.aspectRatio === option}
              disabled={disabled}
              label={option}
              onClick={() => {
                const patch: Partial<VideoGenerationSettings> = { aspectRatio: option }
                // If switching to 9:16 and currently on 1080p, fall back to 720p
                if (option === '9:16' && value.resolution === '1080p') {
                  patch.resolution = '720p'
                }
                onChange(patch)
              }}
            />
          ))}
        </SettingGroup>

        {/* Quality — filtered: 1080p hidden when 9:16 */}
        <SettingGroup title={t('qualityLabel')} hint={t('qualityHint')}>
          {visibleResolutions.map((option) => {
            const cost = calculateVideoCredits({ resolution: option })
            return (
              <OptionButton
                key={option}
                active={value.resolution === option}
                disabled={disabled}
                label={option === '4k' ? '4K' : option}
                note={`${cost} ${t('creditsShort')}`}
                onClick={() => onChange({ resolution: option })}
              />
            )
          })}
        </SettingGroup>

        {/* Duration — hidden: Veo i2v always produces 8s */}

        {/* Voice mode — only for UGC templates */}
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

        {/* Negative prompt — always visible */}
        <div>
          <div className="mb-2">
            <p className="text-sm font-semibold text-foreground">{t('negativePromptLabel')}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t('negativePromptHint')}
            </p>
          </div>
          <textarea
            value={value.negativePrompt}
            onChange={(e) => onChange({ negativePrompt: e.target.value })}
            disabled={disabled}
            maxLength={VIDEO_NEGATIVE_PROMPT_MAX_LENGTH}
            rows={2}
            placeholder={t('negativePromptPlaceholder')}
            className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-rose-gold-300 focus:outline-none focus:ring-1 focus:ring-rose-gold-200 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
