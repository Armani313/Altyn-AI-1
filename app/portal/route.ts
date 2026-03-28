/**
 * GET /portal
 *
 * Creates an authenticated Polar Customer Portal session
 * and redirects the user to manage their subscription.
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

  try {
    // Look up Polar customer by our Supabase user ID (externalId)
    const customerState = await polar.customers.getStateExternal({
      externalId: user.id,
    })

    const session = await polar.customerSessions.create({
      customerId: customerState.id,
    })

    // MED-7: validate portal URL before redirect (defense against compromised API)
    const portalUrl = session.customerPortalUrl
    const allowedHosts = ['sandbox.polar.sh', 'dashboard.polar.sh']
    const parsedHost = new URL(portalUrl).hostname
    if (!allowedHosts.includes(parsedHost)) {
      console.error(`Polar portal: unexpected redirect host "${parsedHost}" — blocked`)
      return NextResponse.redirect(new URL('/settings/billing', request.url))
    }

    return NextResponse.redirect(portalUrl)
  } catch (err) {
    // HIGH-1: explicit warning for monitoring (covers "customer not found" case too)
    console.warn(
      `Polar portal: session failed for user=${user.id} —`,
      err instanceof Error ? err.message : err
    )
    return NextResponse.redirect(new URL('/settings/billing', request.url))
  }
}
