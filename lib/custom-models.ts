import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const CUSTOM_MODELS_BUCKET = 'jewelry-uploads'
const LEGACY_CUSTOM_MODELS_BUCKET = 'generated-images'
const CUSTOM_MODELS_PREFIX = 'user-models'
const SIGNED_URL_TTL_SEC = 60 * 60

type ServiceSupabase = SupabaseClient<Database>

interface StorageObjectRef {
  bucket: string
  path: string
}

function startsWithHttp(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://')
}

function getOwnedPrefixes(userId: string): string[] {
  return [
    `${CUSTOM_MODELS_PREFIX}/${userId}/`,
    `${userId}/`,
  ]
}

function isOwnedCustomModelPath(path: string, userId: string): boolean {
  return getOwnedPrefixes(userId).some((prefix) => path.startsWith(prefix))
}

function parseStorageUrl(url: string): StorageObjectRef | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const publicMatch = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  if (publicMatch) {
    return {
      bucket: publicMatch[1],
      path: decodeURIComponent(publicMatch[2]),
    }
  }

  const signMatch = parsed.pathname.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/)
  if (signMatch) {
    return {
      bucket: signMatch[1],
      path: decodeURIComponent(signMatch[2]),
    }
  }

  return null
}

export function buildCustomModelPath(userId: string, fileName: string): string {
  return `${CUSTOM_MODELS_PREFIX}/${userId}/${fileName}`
}

export function resolveCustomModelStorageRef(
  storedValue: string,
  userId: string,
): StorageObjectRef | null {
  if (!storedValue) return null

  if (!startsWithHttp(storedValue)) {
    if (!isOwnedCustomModelPath(storedValue, userId)) return null
    return {
      bucket: CUSTOM_MODELS_BUCKET,
      path: storedValue,
    }
  }

  const parsed = parseStorageUrl(storedValue)
  if (!parsed) return null
  if (!isOwnedCustomModelPath(parsed.path, userId)) return null
  if (parsed.bucket !== CUSTOM_MODELS_BUCKET && parsed.bucket !== LEGACY_CUSTOM_MODELS_BUCKET) {
    return null
  }

  return parsed
}

export async function buildSignedCustomModelUrls(
  supabase: ServiceSupabase,
  userId: string,
  storedValues: string[],
): Promise<string[]> {
  const urls: string[] = []

  for (const storedValue of storedValues) {
    const objectRef = resolveCustomModelStorageRef(storedValue, userId)
    if (!objectRef) continue

    if (objectRef.bucket === LEGACY_CUSTOM_MODELS_BUCKET) {
      const { data } = supabase.storage.from(objectRef.bucket).getPublicUrl(objectRef.path)
      urls.push(data.publicUrl)
      continue
    }

    const { data, error } = await supabase.storage
      .from(objectRef.bucket)
      .createSignedUrl(objectRef.path, SIGNED_URL_TTL_SEC)

    if (error || !data?.signedUrl) {
      console.warn('Custom model signed URL error:', error)
      continue
    }

    urls.push(data.signedUrl)
  }

  return urls
}

export async function downloadCustomModel(
  supabase: ServiceSupabase,
  userId: string,
  storedValue: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const objectRef = resolveCustomModelStorageRef(storedValue, userId)
  if (!objectRef) return null

  const { data, error } = await supabase.storage.from(objectRef.bucket).download(objectRef.path)
  if (error || !data) {
    console.warn('Custom model download error:', error)
    return null
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const mimeType = data.type || 'image/jpeg'

  return { buffer, mimeType }
}
