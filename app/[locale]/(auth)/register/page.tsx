import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { RegisterForm } from '@/components/auth/register-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.register' })
  return { title: t('pageTitle') }
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <RegisterForm />
}
