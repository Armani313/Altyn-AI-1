'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function logout() {
  const supabase = await createClient()
  // LOW-8: scope: 'global' invalidates the session on all devices,
  // not just the current browser tab.
  await supabase.auth.signOut({ scope: 'global' })
  redirect('/login')
}
