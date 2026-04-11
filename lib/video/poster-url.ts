import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { VIDEO_INPUT_BUCKET } from '@/lib/video/constants'

export async function createSignedPosterUrl(
  supabase: SupabaseClient<Database>,
  inputImagePath: string | null,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!inputImagePath) return null

  const { data, error } = await supabase.storage
    .from(VIDEO_INPUT_BUCKET)
    .createSignedUrl(inputImagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    return null
  }

  return data.signedUrl
}
