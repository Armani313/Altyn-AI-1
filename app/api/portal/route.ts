/**
 * GET /api/portal
 *
 * Creates a Polar customer session and redirects to the Customer Portal.
 * The portal lets users view orders, manage subscriptions, and update payment methods.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { polar } from '@/lib/payments/polar'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await polar.customerSessions.create({
      externalCustomerId: user.id,
      returnUrl: `${appUrl}/settings/billing`,
    })

    return NextResponse.redirect(session.customerPortalUrl)
  } catch (err) {
    console.error('Polar customer portal session failed:', err)
    return NextResponse.redirect(
      new URL('/settings/billing?error=portal', request.url)
    )
  }
}
