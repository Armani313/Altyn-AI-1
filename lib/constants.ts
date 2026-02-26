// ── Image upload constraints ──────────────────────────────────────────────────
// Single source of truth — used by upload-zone, /api/upload, /api/generate

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export const MAX_IMAGE_MB    = 10
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024

export const SAFE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const
