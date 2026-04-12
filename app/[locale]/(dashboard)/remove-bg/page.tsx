import { redirect } from 'next/navigation'

export default async function RemoveBgPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const editorPath = locale === 'en' ? '/editor' : `/${locale}/editor`
  redirect(editorPath)
}
