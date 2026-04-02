/**
 * Shared security utilities used across API routes.
 */

// ── SSRF guard ────────────────────────────────────────────────────────────────

/**
 * Asserts that a URL is safe to server-fetch from Supabase Storage.
 * Prevents SSRF by blocking requests to internal/unexpected hosts.
 * Throws on unsafe URLs; callers should catch and treat as "model unavailable".
 */
export function assertSafeStorageUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL format.')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed.')
  }
  // Supabase Storage public/signed URLs always end with .supabase.co
  if (!parsed.hostname.endsWith('.supabase.co')) {
    throw new Error(`URL host not in allowlist: ${parsed.hostname}`)
  }
}

// ── Magic bytes file-type detection ──────────────────────────────────────────

/**
 * Detects the actual image MIME type from the first bytes of a buffer.
 * Returns null if the format is not recognised.
 * Prevents clients from bypassing MIME-type checks via a spoofed Content-Type.
 */
export function detectImageMimeType(buf: Uint8Array): string | null {
  if (buf.length < 12) return null

  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'

  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'

  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp'

  // HEIC/HEIF: ftyp box at offset 4 (66 74 79 70)
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return 'image/heic'

  return null
}

const MAGIC_ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

/**
 * Validates that a file buffer is actually an accepted image via magic bytes.
 * Throws a user-facing error on failure.
 */
export function assertSafeImageBytes(buf: Uint8Array): void {
  const detected = detectImageMimeType(buf)
  if (!detected || !MAGIC_ACCEPTED.has(detected)) {
    throw new Error(
      'Файл не является допустимым изображением. Поддерживаются форматы: JPG, PNG, WebP, HEIC.'
    )
  }
}

