/**
 * GET /api/portal
 *
 * Creates a Polar customer session and redirects to the Customer Portal.
 * The portal lets users view orders, manage subscriptions, and update payment methods.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { polar, getPolarServerConfigError } from '@/lib/payments/polar'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const polarConfigError = getPolarServerConfigError()
  if (polarConfigError) {
    console.error(polarConfigError)
    return NextResponse.redirect(new URL('/settings/billing?error=portal', request.url))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const session = await polar.customerSessions.create({
      externalCustomerId: user.id,
      returnUrl: `${appUrl}/settings/billing`,
    })

    const portalUrl = session.customerPortalUrl
    const allowedHosts = ['sandbox.polar.sh', 'dashboard.polar.sh']
    const parsedHost = new URL(portalUrl).hostname
    if (!allowedHosts.includes(parsedHost)) {
      console.error(`Polar API portal: unexpected redirect host "${parsedHost}" — blocked`)
      return NextResponse.redirect(new URL('/settings/billing?error=portal', request.url))
    }

    return NextResponse.redirect(portalUrl)
  } catch (err) {
    console.error('Polar customer portal session failed:', err)
    return NextResponse.redirect(
      new URL('/settings/billing?error=portal', request.url)
    )
  }
}
