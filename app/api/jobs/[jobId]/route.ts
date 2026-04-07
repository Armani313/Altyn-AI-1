/**
 * GET /api/jobs/[jobId]
 *
 * Poll job status. Used by async callers (e.g. video generation).
 * Image jobs are returned inline from /api/generate, but if they time out
 * the client can also poll here.
 *
 * Response:
 *   { jobId, status, progress?, resultUrl?, error? }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aiQueue } from '@/lib/queue'
import { UUID_REGEX } from '@/lib/constants'
import { finalizeGenerateJob, type FinalizeGenerateJobMeta } from '@/lib/generate/finalize-generate-job'

export const maxDuration = 5
export const runtime     = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Необходимо авторизоваться.' }, { status: 401 })
  }

  // ── Validate jobId ──────────────────────────────────────────────────────────
  const { jobId } = await params
  if (!UUID_REGEX.test(jobId)) {
    return NextResponse.json({ error: 'Неверный ID задания.' }, { status: 400 })
  }

  // ── Get job ─────────────────────────────────────────────────────────────────
  const job = aiQueue.getJob(jobId)
  if (!job) {
    return NextResponse.json({ error: 'Задание не найдено.' }, { status: 404 })
  }

  // ── Security: user can only query their own jobs ────────────────────────────
  if (job.userId !== user.id) {
    return NextResponse.json({ error: 'Доступ запрещён.' }, { status: 403 })
  }

  // ── Return status ───────────────────────────────────────────────────────────
  if (job.type === 'image' && job.meta?.kind === 'generate-image') {
    const finalized = await finalizeGenerateJob(job, job.meta as FinalizeGenerateJobMeta)
    return NextResponse.json({
      jobId: job.id,
      status: finalized.status,
      type: job.type,
      error: finalized.error ?? null,
      outputUrl: finalized.outputUrl ?? null,
      panels: finalized.panels ?? null,
      isContactSheet: finalized.isContactSheet ?? false,
      creditsRemaining: finalized.creditsRemaining,
      startedAt: job.startedAt ?? null,
      completedAt: job.completedAt ?? null,
    })
  }

  return NextResponse.json({
    jobId:      job.id,
    status:     job.status,
    type:       job.type,
    error:      job.error   ?? null,
    resultUrl:  job.result?.videoUrl ?? null,
    startedAt:  job.startedAt   ?? null,
    completedAt: job.completedAt ?? null,
  })
}
