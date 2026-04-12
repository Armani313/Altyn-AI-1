import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/server'
import { claimSignupTrialForUser } from '@/lib/auth/signup-trial'
import { DashboardProfileProvider } from '@/components/dashboard/dashboard-profile-provider'
import { Sidebar } from '@/components/dashboard/sidebar'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import type { Profile } from '@/types/database.types'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to locale-prefixed login
  if (!user) {
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    redirect(loginPath)
  }

  const profileSelect = 'contact_name, business_name, credits_remaining, plan, trial_credits_decision'

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select(profileSelect)
    .eq('id', user.id)
    .single()

  let profile = profileRaw as Pick<
    Profile,
    'contact_name' | 'business_name' | 'credits_remaining' | 'plan' | 'trial_credits_decision'
  > | null

  if (profile?.trial_credits_decision === 'pending' && user.email) {
    await claimSignupTrialForUser({
      userId: user.id,
      email: user.email,
    })

    const { data: refreshedProfileRaw } = await supabase
      .from('profiles')
      .select(profileSelect)
      .eq('id', user.id)
      .single()

    profile = refreshedProfileRaw as Pick<
      Profile,
      'contact_name' | 'business_name' | 'credits_remaining' | 'plan' | 'trial_credits_decision'
    > | null
  }

  return (
    <DashboardProfileProvider initialProfile={profile}>
      <div className="flex min-h-screen bg-[#FAF9F6]">
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar />

        <div className="flex-1 lg:ml-[240px] min-w-0 flex flex-col">
          {/* Mobile top bar — hidden on desktop */}
          <div
            className="flex items-center justify-center px-4 py-3 border-b border-cream-200 bg-white/80 backdrop-blur-xl lg:hidden"
            style={{ paddingTop: 'calc(var(--safe-top, 0px) + 8px)' }}
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg gradient-rose-gold flex items-center justify-center">
                <span className="text-white text-[10px] font-bold font-serif">L</span>
              </div>
              <span className="font-serif text-sm font-semibold text-foreground tracking-tight">
                Luminify
              </span>
            </Link>
          </div>

          {/* Content area with bottom padding for bottom nav on mobile */}
          <div className="flex-1 pb-[var(--bottom-nav-height)] lg:pb-0">
            {children}
          </div>
        </div>

        {/* Mobile bottom navigation — hidden on desktop */}
        <BottomNav />
      </div>
    </DashboardProfileProvider>
  )
}
