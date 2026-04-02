import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { ToolsIndex } from '@/components/tools/tools-index'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'toolsPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      <main>
        <ToolsIndex />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
