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

// ── Model photos (public/models/) ─────────────────────────────────────────────
// Static list — filenames and IDs never come from user input.
// API routes look up files via MODEL_PHOTO_MAP[validatedId].filename.

export type ModelCategory = 'necklaces' | 'earrings' | 'rings'

export interface ModelPhoto {
  id:        string
  filename:  string
  name:      string
  category:  ModelCategory
  label?:    string
  premium?:  boolean
}

export const MODEL_PHOTOS: ModelPhoto[] = [
  { id: 'model-1', filename: '1.jpeg', name: 'Элегантное декольте',  category: 'necklaces', label: 'Хит'   },
  { id: 'model-2', filename: '2.png',  name: 'Классический профиль', category: 'earrings'                  },
  { id: 'model-3', filename: '3.jpeg', name: 'Нежный жест',          category: 'earrings',  label: 'Новый' },
  { id: 'model-4', filename: '4.jpeg', name: 'Тёплая улыбка',        category: 'earrings'                  },
  { id: 'model-5', filename: '5.jpeg', name: 'Деловой стиль',        category: 'rings'                     },
  { id: 'model-6', filename: '6.png',  name: 'Драматика',            category: 'rings',     premium: true  },
  { id: 'model-7', filename: '7.jpeg', name: 'Праздничный вечер',    category: 'necklaces'                 },
  { id: 'model-8', filename: '8.png',  name: 'Гламур',               category: 'earrings',  premium: true  },
  { id: 'model-9', filename: '9.jpeg', name: 'Утончённость',         category: 'necklaces', label: 'Хит'   },
]

/** Safe lookup: validated model_id → ModelPhoto. Never build paths from raw user input. */
export const MODEL_PHOTO_MAP: Record<string, ModelPhoto> = Object.fromEntries(
  MODEL_PHOTOS.map((m) => [m.id, m])
)

/** Set of valid model IDs — use for allowlist validation in API routes. */
export const VALID_MODEL_IDS = new Set(MODEL_PHOTOS.map((m) => m.id))
