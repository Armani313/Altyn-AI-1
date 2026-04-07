import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { aiQueue } from '@/lib/queue'
import { UUID_REGEX } from '@/lib/constants'
import type { Json } from '@/types/database.types'
import {
  readMetadataObject,
  readPanelVariantsFromMetadata,
} from '@/lib/generate/panel-variants'
import { finalizeGenerateJob, type FinalizeGenerateJobMeta } from '@/lib/generate/finalize-generate-job'

export const maxDuration = 5
export const runtime = 'nodejs'

interface PanelVariant {
  id: number
  url: string
  thumbUrl?: string
  is_upscaled?: boolean
}

interface GenerationMetadata {
  is_contact_sheet?: Json
  status_poll_token?: Json
  async_job_id?: Json
  credits_remaining_after_enqueue?: Json
}

function buildStatusPayload(args: {
  generationId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  outputUrl?: string | null
  panels?: PanelVariant[] | null
  isContactSheet?: boolean
  error?: string | null
  creditsRemaining?: number
}) {
  return {
    generationId: args.generationId,
    status: args.status,
    outputUrl: args.outputUrl ?? null,
    panels: args.panels ?? null,
    isContactSheet: args.isContactSheet ?? false,
    error: args.error ?? null,
    creditsRemaining: args.creditsRemaining,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const { generationId } = await params
  if (!UUID_REGEX.test(generationId)) {
    return NextResponse.json({ error: 'Неверный ID генерации.' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const statusToken = searchParams.get('token')

  const serviceSupabase = createServiceClient()

  const { data: rowRaw } = await serviceSupabase
    .from('generations')
    .select('id, user_id, status, output_image_url, error_message, metadata')
    .eq('id', generationId)
    .single()

  const row = rowRaw as {
    id: string
    user_id: string
    status: 'processing' | 'completed' | 'failed' | 'pending'
    output_image_url: string | null
    error_message: string | null
    metadata?: Json
  } | null

  if (!row) {
    return NextResponse.json({ error: 'Генерация не найдена.' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const metadata = readMetadataObject(row.metadata) as GenerationMetadata

  const tokenMatches =
    typeof metadata?.status_poll_token === 'string' &&
    typeof statusToken === 'string' &&
    metadata.status_poll_token === statusToken

  const userMatches = user?.id === row.user_id

  if (!tokenMatches && !userMatches) {
    return NextResponse.json({ error: 'Генерация не найдена.' }, { status: 404 })
  }

  const asyncJobId = typeof metadata?.async_job_id === 'string'
    ? metadata.async_job_id
    : null

  if ((row.status === 'processing' || row.status === 'pending') && asyncJobId) {
    const job = aiQueue.getJob(asyncJobId)

    if (
      job &&
      job.userId === row.user_id &&
      job.type === 'image' &&
      job.meta?.kind === 'generate-image'
    ) {
      const finalized = await finalizeGenerateJob(job, job.meta as FinalizeGenerateJobMeta)

      if (finalized.status === 'completed' || finalized.status === 'failed') {
        return NextResponse.json(buildStatusPayload({
          generationId: row.id,
          status: finalized.status,
          outputUrl: finalized.outputUrl ?? null,
          panels: finalized.panels ?? null,
          isContactSheet: finalized.isContactSheet ?? false,
          error: finalized.error ?? null,
          creditsRemaining: finalized.creditsRemaining,
        }))
      }

      return NextResponse.json(buildStatusPayload({
        generationId: row.id,
        status: finalized.status === 'queued' ? 'processing' : finalized.status,
        outputUrl: row.output_image_url,
        panels: null,
        isContactSheet: metadata?.is_contact_sheet === true,
        error: row.error_message,
        creditsRemaining: finalized.creditsRemaining,
      }))
    }
  }

  const panelsRaw = readPanelVariantsFromMetadata(row.metadata) as PanelVariant[]
  const panels = panelsRaw.length > 0 ? panelsRaw : null

  const isContactSheet = metadata?.is_contact_sheet === true || Boolean(panels?.length)
  const creditsRemaining = typeof metadata?.credits_remaining_after_enqueue === 'number'
    ? metadata.credits_remaining_after_enqueue
    : undefined

  return NextResponse.json(buildStatusPayload({
    generationId: row.id,
    status: row.status === 'pending' ? 'processing' : row.status,
    outputUrl: row.output_image_url,
    panels,
    isContactSheet,
    error: row.error_message,
    creditsRemaining,
  }))
}
