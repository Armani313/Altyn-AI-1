import type { Json } from '@/types/database.types'
import {
  VIDEO_ASPECT_RATIO,
  VIDEO_CREDITS_COST,
  VIDEO_DURATION_SECONDS,
  VIDEO_RESOLUTION,
} from '@/lib/video/constants'

/** Veo 3.1 supports only 9:16 and 16:9. */
export const VIDEO_ASPECT_RATIO_OPTIONS = [
  VIDEO_ASPECT_RATIO,
  '16:9',
] as const

export const VIDEO_DURATION_OPTIONS = [
  4,
  6,
  VIDEO_DURATION_SECONDS,
] as const

export const VIDEO_RESOLUTION_OPTIONS = [
  VIDEO_RESOLUTION,
  '1080p',
  '4k',
] as const

export const VIDEO_VOICE_MODE_OPTIONS = [
  'auto',
  'ru',
  'en',
  'kz',
  'silent',
] as const

export type VideoAspectRatioOption = typeof VIDEO_ASPECT_RATIO_OPTIONS[number]
export type VideoDurationOption = typeof VIDEO_DURATION_OPTIONS[number]
export type VideoResolutionOption = typeof VIDEO_RESOLUTION_OPTIONS[number]
export type VideoVoiceMode = typeof VIDEO_VOICE_MODE_OPTIONS[number]

export interface VideoGenerationSettings {
  aspectRatio: VideoAspectRatioOption
  durationSeconds: VideoDurationOption
  resolution: VideoResolutionOption
  voiceMode: VideoVoiceMode
  negativePrompt: string
}

export interface VideoSettingsInput {
  aspectRatio?: string | null
  durationSeconds?: string | number | null
  resolution?: string | null
  voiceMode?: string | null
  negativePrompt?: string | null
}

export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  aspectRatio: VIDEO_ASPECT_RATIO,
  durationSeconds: VIDEO_DURATION_SECONDS,
  resolution: VIDEO_RESOLUTION,
  voiceMode: 'auto',
  negativePrompt: '',
}

export const VIDEO_NEGATIVE_PROMPT_MAX_LENGTH = 300

const VIDEO_RESOLUTION_COST: Record<VideoResolutionOption, number> = {
  '720p': VIDEO_CREDITS_COST,
  '1080p': VIDEO_CREDITS_COST + 2,
  '4k': VIDEO_CREDITS_COST + 8,
}

function isObjectLike(value: Json | null | undefined): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asAspectRatio(value: string | null | undefined): VideoAspectRatioOption {
  if (typeof value === 'string' && (VIDEO_ASPECT_RATIO_OPTIONS as readonly string[]).includes(value)) {
    return value as VideoAspectRatioOption
  }

  return DEFAULT_VIDEO_SETTINGS.aspectRatio
}

function asDuration(value: string | number | null | undefined): VideoDurationOption {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number.parseInt(value, 10)
      : NaN

  if ((VIDEO_DURATION_OPTIONS as readonly number[]).includes(parsed)) {
    return parsed as VideoDurationOption
  }

  return DEFAULT_VIDEO_SETTINGS.durationSeconds
}

function asResolution(value: string | null | undefined): VideoResolutionOption {
  if (typeof value === 'string' && (VIDEO_RESOLUTION_OPTIONS as readonly string[]).includes(value)) {
    return value as VideoResolutionOption
  }

  return DEFAULT_VIDEO_SETTINGS.resolution
}

function asVoiceMode(value: string | null | undefined): VideoVoiceMode {
  if (typeof value === 'string' && (VIDEO_VOICE_MODE_OPTIONS as readonly string[]).includes(value)) {
    return value as VideoVoiceMode
  }

  return DEFAULT_VIDEO_SETTINGS.voiceMode
}

function asNegativePrompt(value: string | null | undefined): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, VIDEO_NEGATIVE_PROMPT_MAX_LENGTH)
}

/**
 * Enforce Veo 3.1 image-to-video constraints:
 * - Duration is always 8s (Veo ignores other values for i2v)
 * - 1080p requires 16:9 aspect ratio
 */
function enforceConstraints(
  resolution: VideoResolutionOption,
  aspectRatio: VideoAspectRatioOption,
): { resolution: VideoResolutionOption; aspectRatio: VideoAspectRatioOption } {
  if (resolution === '1080p' && aspectRatio !== '16:9') {
    return { resolution: '720p', aspectRatio }
  }

  return { resolution, aspectRatio }
}

export function sanitizeVideoSettings(
  input: VideoSettingsInput,
  options: { isUgcTemplate: boolean }
): VideoGenerationSettings {
  const voiceMode = options.isUgcTemplate ? asVoiceMode(input.voiceMode) : 'silent'
  const rawResolution = asResolution(input.resolution)
  const rawAspectRatio = asAspectRatio(input.aspectRatio)

  const { resolution, aspectRatio } = enforceConstraints(rawResolution, rawAspectRatio)

  return {
    aspectRatio,
    durationSeconds: 8,
    resolution,
    voiceMode,
    negativePrompt: asNegativePrompt(input.negativePrompt),
  }
}

export function readVideoSettingsFromMetadata(
  metadata: Json | null | undefined,
  options: { isUgcTemplate: boolean }
): VideoGenerationSettings {
  const value = isObjectLike(metadata) ? metadata : {}

  return sanitizeVideoSettings(
    {
      aspectRatio: typeof value.aspect_ratio === 'string' ? value.aspect_ratio : null,
      durationSeconds:
        typeof value.duration_seconds === 'number' || typeof value.duration_seconds === 'string'
          ? value.duration_seconds
          : null,
      resolution: typeof value.resolution === 'string' ? value.resolution : null,
      voiceMode: typeof value.voice_mode === 'string' ? value.voice_mode : null,
      negativePrompt: typeof value.negative_prompt === 'string' ? value.negative_prompt : null,
    },
    options
  )
}

export function calculateVideoCredits(settings: Pick<VideoGenerationSettings, 'resolution'>): number {
  return VIDEO_RESOLUTION_COST[settings.resolution]
}
