import { redirect } from 'next/navigation'

// Generation history lives at /library
export default async function HistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const path = locale === 'en' ? '/library' : `/${locale}/library`
  redirect(path)
}
