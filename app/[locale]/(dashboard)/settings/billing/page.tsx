import { redirect } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { BillingPlans } from '@/components/settings/billing-plans'
import type { Profile, Subscription } from '@/types/database.types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'billing' })
  return { title: t('title') }
}

export default async function BillingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ status?: string; error?: string }>
  params: Promise<{ locale: string }>
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'billing' })
  const tSettings = await getTranslations({ locale, namespace: 'settings' })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    redirect(loginPath)
  }

  const [profileRes, subscriptionRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, credits_remaining')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('plan, status, expires_at, amount, starts_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.data as Pick<Profile, 'plan' | 'credits_remaining'> | null
  const sub     = subscriptionRes.data as Pick<
    Subscription,
    'plan' | 'status' | 'expires_at' | 'amount' | 'starts_at'
  > | null

  const paymentSuccess = resolvedSearchParams.status === 'success'
  const portalError    = resolvedSearchParams.error === 'portal'

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={tSettings('title')} profile={profile} />

      <div className="flex-1 p-5 xl:p-6">
        <div className="max-w-3xl mx-auto">
          <SettingsTabs />

          {paymentSuccess && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-4 mb-6">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{t('successTitle')}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{t('successDesc')}</p>
              </div>
            </div>
          )}

          {portalError && (
            <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 text-destructive rounded-2xl px-5 py-4 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{t('portalError')}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-cream-200 shadow-soft p-6">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-medium text-foreground">
                {t('planAndPayment')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('choosePlan')}
              </p>
            </div>

            <BillingPlans
              currentPlan={profile?.plan ?? 'free'}
              expiresAt={sub?.expires_at ?? null}
              creditsLeft={profile?.credits_remaining ?? 0}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center mt-5">
            {t('invoiceNote')}{' '}
            <a
              href="mailto:arman@luminify.app"
              className="text-primary hover:underline underline-offset-2"
            >
              {t('invoiceContact')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
