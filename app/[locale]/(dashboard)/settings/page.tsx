import { redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { ProfileForm } from '@/components/settings/profile-form'
import { logout } from '@/lib/supabase/actions'
import type { Profile } from '@/types/database.types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })
  return { title: t('title') }
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'settings' })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    redirect(loginPath)
  }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('business_name, contact_name, phone, credits_remaining, plan')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Pick<
    Profile,
    'business_name' | 'contact_name' | 'phone' | 'credits_remaining' | 'plan'
  > | null

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={t('title')} profile={profile} />

      <div className="flex-1 p-5 xl:p-6">
        <div className="max-w-2xl mx-auto">
          <SettingsTabs />

          <div className="bg-white rounded-2xl border border-cream-200 shadow-soft p-6">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-medium text-foreground">
                {t('accountData')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('accountInfo')}
              </p>
            </div>

            <ProfileForm
              initialData={{
                business_name: profile?.business_name ?? '',
                contact_name:  profile?.contact_name  ?? '',
                phone:         profile?.phone          ?? '',
              }}
              email={user.email ?? ''}
            />
          </div>

          <div className="mt-5 bg-white rounded-2xl border border-cream-200 shadow-soft p-6">
            <h2 className="font-serif text-base font-medium text-foreground mb-1">
              {t('account')}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('registered')}{' '}
              {new Date(user.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
              >
                {t('logout')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
