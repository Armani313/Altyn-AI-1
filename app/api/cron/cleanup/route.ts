/**
 * POST /api/cron/cleanup
 *
 * Deletes generations older than CLEANUP_RETENTION_DAYS (default: 90).
 * Removes storage files from both buckets, then deletes DB records.
 *
 * Security: requires Authorization: Bearer <CRON_SECRET>
 *
 * Called daily by server crontab:
 *   0 3 * * * curl -s -X POST http://localhost:3000/api/cron/cleanup \
 *     -H "Authorization: Bearer $CRON_SECRET" >> /var/log/luminify-cleanup.log 2>&1
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const maxDuration = 60

const RETENTION_DAYS = Number(process.env.CLEANUP_RETENTION_DAYS ?? 15)
const BATCH_SIZE     = 100
const INPUT_BUCKET   = 'jewelry-uploads'
const OUTPUT_BUCKET  = 'generated-images'

export async function POST(request: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Cleanup] CRON_SECRET not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const auth = request.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Query expired generations ────────────────────────────────────────────────
  const supabase  = createServiceClient()
  const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error: queryErr } = await supabase
    .from('generations')
    .select('id, user_id, input_image_url, output_image_url')
    .lt('created_at', cutoffDate)
    .neq('status', 'processing') // never delete in-flight jobs
    .limit(BATCH_SIZE)

  if (queryErr) {
    console.error('[Cleanup] query error:', queryErr)
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
  }

  if (!rows || rows.length === 0) {
    console.log(`[Cleanup] nothing to delete (cutoff: ${cutoffDate})`)
    return NextResponse.json({ deleted: 0, retention_days: RETENTION_DAYS })
  }

  // ── Collect storage paths ────────────────────────────────────────────────────
  const inputPaths:  string[] = []
  const outputPaths: string[] = []
  const ids:         string[] = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Public URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
  const outputPrefix = `${supabaseUrl}/storage/v1/object/public/${OUTPUT_BUCKET}/`

  for (const row of rows as Array<{
    id: string
    user_id: string
    input_image_url: string | null
    output_image_url: string | null
  }>) {
    ids.push(row.id)

    // input_image_url is stored as a storage path (not full URL)
    if (row.input_image_url) {
      inputPaths.push(row.input_image_url)
    }

    // output_image_url is stored as full public URL — extract path
    if (row.output_image_url?.startsWith(outputPrefix)) {
      outputPaths.push(row.output_image_url.slice(outputPrefix.length))
    }
  }

  // ── Delete storage files ─────────────────────────────────────────────────────
  let storageErrors = 0

  if (inputPaths.length > 0) {
    const { error } = await supabase.storage.from(INPUT_BUCKET).remove(inputPaths)
    if (error) {
      console.error('[Cleanup] input storage delete error:', error)
      storageErrors++
    }
  }

  if (outputPaths.length > 0) {
    const { error } = await supabase.storage.from(OUTPUT_BUCKET).remove(outputPaths)
    if (error) {
      console.error('[Cleanup] output storage delete error:', error)
      storageErrors++
    }
  }

  // ── Delete DB records ────────────────────────────────────────────────────────
  const { error: deleteErr } = await supabase
    .from('generations')
    .delete()
    .in('id', ids)

  if (deleteErr) {
    console.error('[Cleanup] DB delete error:', deleteErr)
    return NextResponse.json({ error: 'DB delete failed', storage_errors: storageErrors }, { status: 500 })
  }

  console.log(
    `[Cleanup] deleted ${ids.length} generations | ` +
    `input files: ${inputPaths.length} | output files: ${outputPaths.length} | ` +
    `storage errors: ${storageErrors} | cutoff: ${cutoffDate}`
  )

  return NextResponse.json({
    deleted:        ids.length,
    input_files:    inputPaths.length,
    output_files:   outputPaths.length,
    storage_errors: storageErrors,
    retention_days: RETENTION_DAYS,
    cutoff:         cutoffDate,
  })
}
