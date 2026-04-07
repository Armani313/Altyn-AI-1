import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Footer } from '@/components/landing/footer'
import { Navbar } from '@/components/landing/navbar'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { TopazToolPage } from '@/components/tools/topaz-tool-page'
import {
  getLocalizedTopazTool,
  isTopazToolSlug,
  TOPAZ_TOOL_SLUGS,
} from '@/lib/tools/topaz-tools'
import { buildLocalizedMetadata, mergeSeoKeywords, type SeoLocale } from '@/lib/seo'

export function generateStaticParams() {
  return TOPAZ_TOOL_SLUGS.flatMap((slug) => [
    { locale: 'en', slug },
    { locale: 'ru', slug },
  ])
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params

  if (!isTopazToolSlug(slug)) {
    return {}
  }

  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  const tool = getLocalizedTopazTool(slug, currentLocale)

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: `/tools/${slug}`,
    title: tool.metaTitle,
    description: tool.metaDescription,
    keywords: mergeSeoKeywords(tool.keywords, ['Luminify', slug.replaceAll('-', ' ')]),
  })
}

export default async function DynamicTopazToolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  if (!isTopazToolSlug(slug)) {
    notFound()
  }

  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  setRequestLocale(locale)

  const tool = getLocalizedTopazTool(slug, currentLocale)
  const relatedTools = tool.related.map((relatedSlug) => getLocalizedTopazTool(relatedSlug, currentLocale))

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      <main>
        <TopazToolPage tool={tool} relatedTools={relatedTools} locale={currentLocale} />
        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
