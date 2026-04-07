import type { Metadata } from 'next'
import Script from 'next/script'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { FaqAccordion } from '@/components/faq/faq-accordion'
import { BgRemoverCta } from '@/components/tools/bg-remover-cta'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale } from '@/lib/seo'

interface FaqPageCopy {
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroSubtitle: string
  primaryCta: string
  secondaryCta: string
  sectionDescription: string
  supportTitle: string
  supportBody: string
  pricingCta: string
}

async function loadFaqPageCopy(locale: 'ru' | 'en'): Promise<FaqPageCopy> {
  if (locale === 'ru') {
    return (await import('@/messages/ru.json')).default.faqPage as FaqPageCopy
  }

  return (await import('@/messages/en.json')).default.faqPage as FaqPageCopy
}

function buildFaqItems(t: Awaited<ReturnType<typeof getTranslations>>) {
  return [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  const copy = await loadFaqPageCopy(currentLocale)

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/faq',
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords: getSeoKeywords('faq', currentLocale as SeoLocale),
  })
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  setRequestLocale(locale)

  const tFaq = await getTranslations({ locale: currentLocale, namespace: 'faq' })
  const copy = await loadFaqPageCopy(currentLocale)
  const items = buildFaqItems(tFaq)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Script
        id="faq-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar />
      <main>
        <section className="relative overflow-hidden px-6 pb-10 pt-28">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-20 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-rose-gold-100/80 via-rose-gold-50/40 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-[-5%] h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-cream-200/70 via-cream-100/30 to-transparent blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-cream-200 bg-white/90 p-8 shadow-card backdrop-blur sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-rose-gold-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-gold-700">
                FAQ
              </span>
              <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight text-foreground">
                {copy.heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {copy.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                >
                  {copy.primaryCta}
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-cream-200 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                >
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FaqAccordion
          items={items}
          overline={tFaq('overline')}
          title={tFaq('title')}
          description={copy.sectionDescription}
          className="px-6 py-16"
        />

        <section className="px-6 pb-24">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[2rem] border border-cream-200 bg-white p-8 shadow-soft sm:p-10">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div>
                  <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-tight text-foreground">
                    {copy.supportTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                    {copy.supportBody}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <a
                    href="mailto:arman@luminify.app"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                  >
                    arman@luminify.app
                  </a>
                  <Link
                    href="/#pricing"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-cream-200 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                  >
                    {copy.pricingCta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <BgRemoverCta />
      </main>
      <Footer />
    </div>
  )
}
