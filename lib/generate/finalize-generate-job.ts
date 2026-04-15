import type { Json } from '@/types/database.types'
import type { QueueJob } from '@/lib/queue/types'
import { createServiceClient } from '@/lib/supabase/service'
import { splitContactSheet } from '@/lib/ai/split-grid'
import { refundByWithRetry } from '@/lib/utils/refund'
import {
  readMetadataObject,
  readPanelVariantsFromMetadata,
  writePanelVariantsToMetadata,
} from '@/lib/generate/panel-variants'

const OUTPUT_BUCKET = 'generated-images'

export interface FinalizeGenerateJobMeta {
  kind: 'generate-image'
  generationId: string
  userId: string
  isContactSheet: boolean
  creditsRemaining: number
}

interface PanelVariant {
  id: number
  url: string
  is_upscaled: boolean
}

interface CompletedGenerationRow {
  status: string
  output_image_url: string | null
  error_message: string | null
  metadata?: Json
}

interface FinalizeResult {
  status: 'queued' | 'processing' | 'completed' | 'failed'
  outputUrl?: string | null
  panels?: Array<{ id: number; url: string; thumbUrl?: string }>
  isContactSheet?: boolean
  error?: string | null
  creditsRemaining: number
}

function buildPanelThumbs(panelVariants: PanelVariant[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return panelVariants.map((panel) => ({
    ...panel,
    thumbUrl: panel.url.replace(
      `${supabaseUrl}/storage/v1/object/public/`,
      `${supabaseUrl}/storage/v1/render/image/public/`
    ) + '?width=400&quality=80',
  }))
}

async function markFailedOnce(
  job: QueueJob,
  meta: FinalizeGenerateJobMeta,
  message: string,
) {
  const supabase = createServiceClient()
  const { data: rowRaw } = await supabase
    .from('generations')
    .select('status')
    .eq('id', meta.generationId)
    .eq('user_id', meta.userId)
    .single()

  const row = rowRaw as { status: string } | null
  if (!row || row.status === 'failed' || row.status === 'completed') {
    return
  }

  // Image generation costs 1 credit; refund the same amount with a
  // ref_id so the audit log links back to the failed generation row.
  await refundByWithRetry(
    supabase,
    meta.userId,
    1,
    'refund_generation',
    meta.generationId,
    'Generate/AsyncJobFailed',
  )
  await supabase
    .from('generations')
    .update({ status: 'failed', error_message: message.slice(0, 200) } as never)
    .eq('id', meta.generationId)
}

export async function finalizeGenerateJob(
  job: QueueJob,
  meta: FinalizeGenerateJobMeta,
): Promise<FinalizeResult> {
  const supabase = createServiceClient()

  const { data: rowRaw } = await supabase
    .from('generations')
    .select('status, output_image_url, error_message, metadata')
    .eq('id', meta.generationId)
    .eq('user_id', meta.userId)
    .single()

  const row = rowRaw as CompletedGenerationRow | null

  if (!row) {
    return {
      status: 'failed',
      error: 'Задание не найдено.',
      creditsRemaining: meta.creditsRemaining,
    }
  }

  if (row.status === 'completed') {
    const panelVariants = readPanelVariantsFromMetadata(row.metadata) as PanelVariant[]
    return {
      status: 'completed',
      outputUrl: row.output_image_url,
      panels: panelVariants.length > 0 ? buildPanelThumbs(panelVariants) : undefined,
      isContactSheet: panelVariants.length > 0 || meta.isContactSheet,
      creditsRemaining: meta.creditsRemaining,
    }
  }

  if (job.status === 'queued' || job.status === 'processing') {
    return {
      status: job.status,
      creditsRemaining: meta.creditsRemaining,
    }
  }

  if (job.status === 'failed' || !job.result?.imageBuffer) {
    const safeErrMsg = (job.error ?? 'Ошибка генерации. Попробуйте снова.').slice(0, 200)
    await markFailedOnce(job, meta, safeErrMsg)
    return {
      status: 'failed',
      error: safeErrMsg,
      creditsRemaining: meta.creditsRemaining,
    }
  }

  const aiImageBuffer = job.result.imageBuffer
  const aiMimeType = job.result.mimeType ?? 'image/jpeg'

  if (meta.isContactSheet) {
    const panels = await splitContactSheet(aiImageBuffer)
    const panelVariants: PanelVariant[] = []

    const uploadResults = await Promise.all(
      panels.map(async (panel) => {
        const panelPath = `${meta.userId}/${meta.generationId}-panel-${panel.id}.jpg`
        const { error } = await supabase.storage
          .from(OUTPUT_BUCKET)
          .upload(panelPath, panel.buffer, { contentType: 'image/jpeg', upsert: false })

        if (error && !String(error.message ?? '').includes('The resource already exists')) {
          throw error
        }

        const { data } = supabase.storage.from(OUTPUT_BUCKET).getPublicUrl(panelPath)
        return { id: panel.id, url: data.publicUrl, is_upscaled: false }
      })
    )

    panelVariants.push(...uploadResults)

    const sheetExt = aiMimeType === 'image/png' ? 'png' : 'jpg'
    const sheetPath = `${meta.userId}/${meta.generationId}-sheet.${sheetExt}`
    const { error: sheetUploadErr } = await supabase.storage
      .from(OUTPUT_BUCKET)
      .upload(sheetPath, aiImageBuffer, { contentType: aiMimeType, upsert: false })

    if (sheetUploadErr && !String(sheetUploadErr.message ?? '').includes('The resource already exists')) {
      throw sheetUploadErr
    }

    const { data: sheetPublic } = supabase.storage.from(OUTPUT_BUCKET).getPublicUrl(sheetPath)

    await supabase
      .from('generations')
      .update({
        status: 'completed',
        output_image_url: sheetPublic.publicUrl,
        metadata: writePanelVariantsToMetadata(row.metadata, panelVariants),
      } as never)
      .eq('id', meta.generationId)

    return {
      status: 'completed',
      outputUrl: sheetPublic.publicUrl,
      panels: buildPanelThumbs(panelVariants),
      isContactSheet: true,
      creditsRemaining: meta.creditsRemaining,
    }
  }

  const ext = aiMimeType === 'image/png' ? 'png' : 'jpg'
  const outputPath = `${meta.userId}/${meta.generationId}-result.${ext}`
  const { error: uploadErr } = await supabase.storage
    .from(OUTPUT_BUCKET)
    .upload(outputPath, aiImageBuffer, { contentType: aiMimeType, upsert: false })

  if (uploadErr && !String(uploadErr.message ?? '').includes('The resource already exists')) {
    throw uploadErr
  }

  const { data: publicData } = supabase.storage.from(OUTPUT_BUCKET).getPublicUrl(outputPath)

  await supabase
    .from('generations')
    .update({
      status: 'completed',
      output_image_url: publicData.publicUrl,
      metadata: readMetadataObject(row.metadata),
    } as never)
    .eq('id', meta.generationId)

  return {
    status: 'completed',
    outputUrl: publicData.publicUrl,
    isContactSheet: false,
    creditsRemaining: meta.creditsRemaining,
  }
}
