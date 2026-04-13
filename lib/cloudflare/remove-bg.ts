/**
 * Cloudflare Image Transformations — Background Removal
 *
 * Uses the `segment=foreground` transform to isolate the subject and replace
 * the background with transparent pixels. Powered by BiRefNet via Workers AI.
 *
 * Flow:
 *   1. Upload image to Supabase Storage temp bucket (public, short-lived)
 *   2. Build Cloudflare transform URL: /cdn-cgi/image/segment=foreground,format=png/<public_url>
 *   3. Fetch the transformed image
 *   4. Delete the temp file from Storage
 *   5. Return the PNG buffer
 *
 * No images are stored permanently — temp file exists only for seconds.
 */

import { createServiceClient } from '@/lib/supabase/service'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

export interface RemoveBgResult {
  imageBuffer: Uint8Array
  mimeType: string
}

export async function removeBackground(
  imageBuffer: Uint8Array,
  mimeType: string,
): Promise<RemoveBgResult> {
  const supabase = createServiceClient()
  const tempPath = `bg-remove/${crypto.randomUUID()}.png`

  // 1. Upload to temp bucket
  const { error: uploadErr } = await supabase.storage
    .from('temp')
    .upload(tempPath, imageBuffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadErr) {
    throw new Error(`Temp upload failed: ${uploadErr.message}`)
  }

  try {
    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('temp')
      .getPublicUrl(tempPath)

    const publicUrl = urlData.publicUrl
    if (!publicUrl) {
      throw new Error('Failed to get public URL for temp image')
    }

    // 3. Fetch from Cloudflare with segment=foreground
    const cfUrl = `${APP_URL}/cdn-cgi/image/segment=foreground,format=png/${publicUrl}`

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
  } finally {
    // 4. Always delete temp file
    await supabase.storage.from('temp').remove([tempPath]).catch((err) => {
      console.warn('[remove-bg] temp cleanup failed:', err)
    })
  }
}
