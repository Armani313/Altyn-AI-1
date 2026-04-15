import type { Json } from '@/types/database.types'
import {
  VIDEO_ASPECT_RATIO,
  VIDEO_CREDITS_COST,
  VIDEO_DURATION_SECONDS,
  VIDEO_RESOLUTION,
} from '@/lib/video/constants'

export const VIDEO_ASPECT_RATIO_OPTIONS = [
  VIDEO_ASPECT_RATIO,
  '1:1',
  '4:5',
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
}

export interface VideoSettingsInput {
  aspectRatio?: string | null
  durationSeconds?: string | number | null
  resolution?: string | null
  voiceMode?: string | null
}

export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  aspectRatio: VIDEO_ASPECT_RATIO,
  durationSeconds: VIDEO_DURATION_SECONDS,
  resolution: VIDEO_RESOLUTION,
  voiceMode: 'auto',
}

const VIDEO_DURATION_COST_MAP: Record<VideoDurationOption, number> = {
  4: 6,
  6: 9,
  8: VIDEO_CREDITS_COST,
}

const VIDEO_RESOLUTION_SURCHARGE: Record<VideoResolutionOption, number> = {
  '720p': 0,
  '1080p': 2,
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

export function sanitizeVideoSettings(
  input: VideoSettingsInput,
  options: { isUgcTemplate: boolean }
): VideoGenerationSettings {
  const voiceMode = options.isUgcTemplate ? asVoiceMode(input.voiceMode) : 'silent'

  return {
    aspectRatio: asAspectRatio(input.aspectRatio),
    durationSeconds: asDuration(input.durationSeconds),
    resolution: asResolution(input.resolution),
    voiceMode,
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
    },
    options
  )
}

export function calculateVideoCredits(settings: Pick<VideoGenerationSettings, 'durationSeconds' | 'resolution'>): number {
  return VIDEO_DURATION_COST_MAP[settings.durationSeconds] + VIDEO_RESOLUTION_SURCHARGE[settings.resolution]
}
