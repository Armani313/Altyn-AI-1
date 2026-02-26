/**
 * Supabase service-role client.
 *
 * Bypasses Row Level Security — use ONLY in trusted server-side contexts:
 *   - Webhook handlers (no user session available)
 *   - Background jobs
 *   - Admin operations
 *
 * Never expose this client to the browser or return it from client components.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service role credentials are not configured.')
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
