/**
 * In-memory temporary image store.
 *
 * Holds uploaded images for a few seconds so that Cloudflare Image
 * Transformations can fetch them from the same zone (luminify.app).
 * Each entry auto-expires after TTL_MS and is cleaned up lazily.
 */

const TTL_MS = 60_000 // 1 minute — more than enough for a CF fetch

interface TempEntry {
  data: Uint8Array
  mime: string
  expires: number
}

const store = new Map<string, TempEntry>()

/** Remove all expired entries (called lazily on put/get). */
function sweep() {
  const now = Date.now()
  for (const [id, entry] of store) {
    if (entry.expires < now) store.delete(id)
  }
}

/** Store image bytes and return its unique ID. */
export function putTempImage(data: Uint8Array, mime: string): string {
  sweep()
  const id = crypto.randomUUID()
  store.set(id, { data, mime, expires: Date.now() + TTL_MS })
  return id
}

/** Retrieve and immediately delete the entry (one-time read). */
export function popTempImage(id: string): TempEntry | null {
  sweep()
  const entry = store.get(id)
  if (!entry || entry.expires < Date.now()) {
    store.delete(id)
    return null
  }
  store.delete(id)
  return entry
}
