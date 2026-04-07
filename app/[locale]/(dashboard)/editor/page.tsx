import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { EditorPageClient } from './client'

type EditorEntryMode = 'remove-bg' | 'photo-editor'

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
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ product?: string; direct?: string; mode?: string }>
}) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  setRequestLocale(locale)

  const initialProduct =
    typeof resolvedSearchParams.product === 'string'
      ? resolvedSearchParams.product
      : null
  const entryMode: EditorEntryMode =
    resolvedSearchParams.mode === 'photo-editor' || resolvedSearchParams.direct === '1'
      ? 'photo-editor'
      : 'remove-bg'

  return (
    <EditorPageClient
      initialProduct={initialProduct}
      entryMode={entryMode}
    />
  )
}
