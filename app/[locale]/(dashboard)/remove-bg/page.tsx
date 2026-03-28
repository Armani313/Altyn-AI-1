import { redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { BgRemovalEditor } from '@/components/remove-bg/BgRemovalEditor'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'removeBg' })
  return { title: t('title') }
}

export default async function RemoveBgPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'removeBg' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    redirect(loginPath)
  }

  return (
    <main className="flex flex-col min-h-screen">
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        profile={null}
        freeService
      />
      <div className="flex-1 p-4 sm:p-6">
        <BgRemovalEditor />
      </div>
    </main>
  )
}
