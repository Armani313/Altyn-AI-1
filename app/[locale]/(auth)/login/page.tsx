import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/auth/login-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })
  return { title: t('pageTitle') }
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LoginForm />
}
