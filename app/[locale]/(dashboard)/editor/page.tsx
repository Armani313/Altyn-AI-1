import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { EditorPageClient } from './client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'editor' })
  return { title: t('pageTitle') }
}

export default async function EditorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <EditorPageClient />
}
