/**
 * Cloudflare Image Transformations — Background Removal
 *
 * Uses the `segment=foreground` transform to isolate the subject and replace
 * the background with transparent pixels. Powered by BiRefNet via Workers AI.
 *
 * Flow:
 *   1. Store image in in-memory temp store
 *   2. Build CF transform URL pointing to /api/tools/temp-serve/[id] (same zone)
 *   3. Fetch the transformed image from CF
 *   4. Return the PNG buffer (temp entry auto-deletes on read)
 *
 * No images are stored permanently — temp entry lives only for seconds.
 */

import { putTempImage } from '@/lib/tools/temp-image-store'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

export interface RemoveBgResult {
  imageBuffer: Uint8Array
  mimeType: string
}

export async function removeBackground(
  imageBuffer: Uint8Array,
  mimeType: string,
): Promise<RemoveBgResult> {
  // 1. Store in temp memory
  const id = putTempImage(imageBuffer, mimeType)

  // 2. Build same-zone source URL that CF can fetch
  const sourceUrl = `${APP_URL}/api/tools/temp-serve/${id}`

  // 3. Fetch from Cloudflare with segment=foreground
  const cfUrl = `${APP_URL}/cdn-cgi/image/segment=foreground,format=png/${sourceUrl}`

  const response = await fetch(cfUrl, {
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Cloudflare transform failed (HTTP ${response.status}): ${text.slice(0, 200)}`
    )
  }

  const resultBuffer = new Uint8Array(await response.arrayBuffer())

  if (resultBuffer.length === 0) {
    throw new Error('Cloudflare returned an empty image')
  }

  return {
    imageBuffer: resultBuffer,
    mimeType: 'image/png',
  }
}
