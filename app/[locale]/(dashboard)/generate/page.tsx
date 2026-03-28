import { redirect } from 'next/navigation'

// Generation workspace lives at /dashboard
export default async function GeneratePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const path = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`
  redirect(path)
}
