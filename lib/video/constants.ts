export const VIDEO_PROVIDER = 'veo-3.1' as const
export const VIDEO_MODEL = 'veo-3.1-generate-preview' as const
export const VIDEO_ASPECT_RATIO = '9:16' as const
export const VIDEO_DURATION_SECONDS = 8 as const
export const VIDEO_RESOLUTION = '720p' as const
export const VIDEO_CREDITS_COST = 6 as const
export const VIDEO_INPUT_BUCKET = 'jewelry-uploads' as const
export const VIDEO_OUTPUT_BUCKET = 'generated-videos' as const
export const VIDEO_SESSION_KEY = 'video:pending-generation' as const

export type VideoAspectRatio = typeof VIDEO_ASPECT_RATIO
export type VideoResolution = typeof VIDEO_RESOLUTION
export type VideoProvider = typeof VIDEO_PROVIDER
