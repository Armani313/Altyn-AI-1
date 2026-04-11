import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { refundWithRetry } from '@/lib/utils/refund'
import { UUID_REGEX } from '@/lib/constants'
import { createSignedPosterUrl } from '@/lib/video/poster-url'
import { readMetadataObject } from '@/lib/generate/panel-variants'
import { downloadVeoVideo, getVeoOperation } from '@/lib/ai/veo'
import { VIDEO_OUTPUT_BUCKET } from '@/lib/video/constants'
import type { VideoGeneration } from '@/types/database.types'
import type { VideoGenerationPollResponse } from '@/lib/video/types'

export const runtime = 'nodejs'
export const maxDuration = 180

type VideoGenerationRow = Pick<
  VideoGeneration,
  | 'id'
  | 'user_id'
  | 'status'
  | 'input_image_url'
  | 'output_video_url'
  | 'error_message'
  | 'provider_operation_name'
  | 'metadata'
>

function json(body: VideoGenerationPollResponse, status = 200) {
  return NextResponse.json(body, { status })
}

async function readCreditsRemaining(userId: string) {
  const serviceSupabase = createServiceClient()
  const { data } = await serviceSupabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single()

  const profile = data as { credits_remaining: number } | null
  return profile?.credits_remaining ?? null
}

async function markFailedOnce(
  row: VideoGenerationRow,
  message: string
) {
  if (row.status === 'failed' || row.status === 'completed') {
    return
  }

  const serviceSupabase = createServiceClient()
  const { data: latestRaw } = await serviceSupabase
    .from('video_generations')
    .select('status')
    .eq('id', row.id)
    .eq('user_id', row.user_id)
    .single()

  const latest = latestRaw as { status: VideoGenerationRow['status'] } | null
  if (!latest || latest.status === 'failed' || latest.status === 'completed') {
    return
  }

  await refundWithRetry(serviceSupabase, row.user_id, 'Video/Finalize')
  await serviceSupabase
    .from('video_generations')
    .update({
      status: 'failed',
      error_message: message.slice(0, 240),
    } as never)
    .eq('id', row.id)
    .eq('user_id', row.user_id)
}

async function finalizeCompletedVideo(
  row: VideoGenerationRow
) {
  const serviceSupabase = createServiceClient()
  const operation = await getVeoOperation(row.provider_operation_name!)

  if (operation.status === 'processing') {
    return { status: 'processing' as const }
  }

  if (operation.status === 'failed') {
    const message = operation.error ?? 'Ошибка генерации видео. Попробуйте снова.'
    await markFailedOnce(row, message)
    return { status: 'failed' as const, error: message }
  }

  const videoBuffer = await downloadVeoVideo(operation.videoUri!)
  const outputPath = `${row.user_id}/${row.id}-result.mp4`

  const { error: uploadError } = await serviceSupabase.storage
    .from(VIDEO_OUTPUT_BUCKET)
    .upload(outputPath, videoBuffer, { contentType: 'video/mp4', upsert: false })

  if (uploadError && !String(uploadError.message ?? '').includes('The resource already exists')) {
    throw uploadError
  }

  const { data: publicData } = serviceSupabase.storage
    .from(VIDEO_OUTPUT_BUCKET)
    .getPublicUrl(outputPath)

  await serviceSupabase
    .from('video_generations')
    .update({
      status: 'completed',
      output_video_url: publicData.publicUrl,
      metadata: {
        ...readMetadataObject(row.metadata),
        provider_video_uri: operation.videoUri,
      },
    } as never)
    .eq('id', row.id)
    .eq('user_id', row.user_id)

  return {
    status: 'completed' as const,
    outputVideoUrl: publicData.publicUrl,
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Необходимо авторизоваться.' }, { status: 401 })
  }

  const { generationId } = await params
  if (!UUID_REGEX.test(generationId)) {
    return NextResponse.json({ error: 'Неверный ID задания.' }, { status: 400 })
  }

  const { data: rowRaw } = await supabase
    .from('video_generations')
    .select('id, user_id, status, input_image_url, output_video_url, error_message, provider_operation_name, metadata')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  const row = rowRaw as VideoGenerationRow | null
  if (!row) {
    return NextResponse.json({ error: 'Видео-задание не найдено.' }, { status: 404 })
  }

  const creditsRemaining = await readCreditsRemaining(user.id)
  const serviceSupabase = createServiceClient()

  if (row.status === 'completed') {
    const posterUrl = await createSignedPosterUrl(serviceSupabase, row.input_image_url)
    return json({
      generationId: row.id,
      status: 'completed',
      outputVideoUrl: row.output_video_url,
      posterUrl,
      creditsRemaining,
      error: null,
    })
  }

  if (row.status === 'failed') {
    const posterUrl = await createSignedPosterUrl(serviceSupabase, row.input_image_url)
    return json({
      generationId: row.id,
      status: 'failed',
      outputVideoUrl: row.output_video_url,
      posterUrl,
      creditsRemaining,
      error: row.error_message ?? 'Ошибка генерации видео.',
    })
  }

  if (!row.provider_operation_name) {
    return json({
      generationId: row.id,
      status: row.status,
      outputVideoUrl: null,
      posterUrl: await createSignedPosterUrl(serviceSupabase, row.input_image_url),
      creditsRemaining,
      error: null,
    })
  }

  try {
    const finalized = await finalizeCompletedVideo(row)
    if (finalized.status === 'processing') {
      return json({
        generationId: row.id,
        status: row.status === 'queued' ? 'queued' : 'processing',
        outputVideoUrl: null,
        posterUrl: await createSignedPosterUrl(serviceSupabase, row.input_image_url),
        creditsRemaining,
        error: null,
      })
    }

    if (finalized.status === 'failed') {
      return json({
        generationId: row.id,
        status: 'failed',
        outputVideoUrl: null,
        posterUrl: await createSignedPosterUrl(serviceSupabase, row.input_image_url),
        creditsRemaining: await readCreditsRemaining(user.id),
        error: finalized.error ?? 'Ошибка генерации видео.',
      })
    }

    return json({
      generationId: row.id,
      status: 'completed',
      outputVideoUrl: finalized.outputVideoUrl,
      posterUrl: await createSignedPosterUrl(serviceSupabase, row.input_image_url),
      creditsRemaining: await readCreditsRemaining(user.id),
      error: null,
    })
  } catch (finalizeError) {
    console.error('[video-generations] finalize error:', finalizeError)
    return json({
      generationId: row.id,
      status: 'processing',
      outputVideoUrl: null,
      posterUrl: await createSignedPosterUrl(serviceSupabase, row.input_image_url),
      creditsRemaining,
      error: null,
    })
  }
}
