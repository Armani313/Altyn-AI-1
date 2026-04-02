/**
 * Standalone cleanup script for GitHub Actions.
 *
 * Deletes generations older than CLEANUP_RETENTION_DAYS from Supabase DB + Storage.
 * Runs directly via `node` — no Next.js server dependency.
 *
 * Required env vars:
 *   SUPABASE_URL           — project URL (https://xxx.supabase.co)
 *   SUPABASE_SERVICE_KEY   — service role key
 *   CLEANUP_RETENTION_DAYS — days to keep (default: 15)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.SUPABASE_URL
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY
const RETENTION     = Number(process.env.CLEANUP_RETENTION_DAYS ?? 15)
const BATCH_SIZE    = 100
const INPUT_BUCKET  = 'jewelry-uploads'
const OUTPUT_BUCKET = 'generated-images'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const cutoff = new Date(Date.now() - RETENTION * 86_400_000).toISOString()
console.log(`Cleanup: retention=${RETENTION}d cutoff=${cutoff}`)

// Query expired generations
const { data: rows, error: queryErr } = await supabase
  .from('generations')
  .select('id, user_id, input_image_url, output_image_url')
  .lt('created_at', cutoff)
  .neq('status', 'processing')
  .limit(BATCH_SIZE)

if (queryErr) {
  console.error('DB query failed:', queryErr.message)
  process.exit(1)
}

if (!rows || rows.length === 0) {
  console.log('Nothing to delete.')
  process.exit(0)
}

// Collect storage paths
const inputPaths  = []
const outputPaths = []
const ids         = []

const outputPrefix = `${SUPABASE_URL}/storage/v1/object/public/${OUTPUT_BUCKET}/`

for (const row of rows) {
  ids.push(row.id)

  if (row.input_image_url) {
    inputPaths.push(row.input_image_url)
  }

  if (row.output_image_url?.startsWith(outputPrefix)) {
    outputPaths.push(row.output_image_url.slice(outputPrefix.length))
  }
}

// Delete storage files
let storageErrors = 0

if (inputPaths.length > 0) {
  const { error } = await supabase.storage.from(INPUT_BUCKET).remove(inputPaths)
  if (error) { console.error('Input storage error:', error.message); storageErrors++ }
}

if (outputPaths.length > 0) {
  const { error } = await supabase.storage.from(OUTPUT_BUCKET).remove(outputPaths)
  if (error) { console.error('Output storage error:', error.message); storageErrors++ }
}

// Delete DB records
const { error: deleteErr } = await supabase
  .from('generations')
  .delete()
  .in('id', ids)

if (deleteErr) {
  console.error('DB delete failed:', deleteErr.message)
  process.exit(1)
}

console.log(
  `Deleted ${ids.length} generations | ` +
  `input files: ${inputPaths.length} | output files: ${outputPaths.length} | ` +
  `storage errors: ${storageErrors}`
)
