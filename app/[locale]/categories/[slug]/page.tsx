import type { Metadata } from 'next'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ShoppingBag, Flower2, Gem, Check, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'
import {
  APP_URL,
  buildLocalizedMetadata,
  getPublicUrl,
  getSeoKeywords,
  type SeoLocale,
} from '@/lib/seo'

type CategorySlug = 'apparel' | 'cosmetics' | 'jewelry'

const CATEGORY_SLUGS: CategorySlug[] = ['apparel', 'cosmetics', 'jewelry']

const CATEGORY_ICONS: Record<CategorySlug, typeof ShoppingBag> = {
  apparel: ShoppingBag,
  cosmetics: Flower2,
  jewelry: Gem,
}

const CATEGORY_PALETTE: Record<CategorySlug, { from: string; to: string; emoji: string; accent: string }> = {
  apparel: { from: 'from-rose-gold-100', to: 'to-rose-gold-200', emoji: '👗', accent: 'bg-rose-gold-400' },
  cosmetics: { from: 'from-rose-gold-50', to: 'to-cream-200', emoji: '💄', accent: 'bg-rose-gold-300' },
  jewelry: { from: 'from-cream-100', to: 'to-rose-gold-100', emoji: '💍', accent: 'bg-rose-gold-500' },
}

const SEO_KEY: Record<CategorySlug, 'category-apparel' | 'category-cosmetics' | 'category-jewelry'> = {
  apparel: 'category-apparel',
  cosmetics: 'category-cosmetics',
  jewelry: 'category-jewelry',
}

interface CategoryCopy {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  heroSecondaryCta: string
  heroBadge: string
  problemTitle: string
  problemBullet1: string
  problemBullet2: string
  problemBullet3: string
  problemBullet4: string
  featuresTitle: string
  featuresSubtitle: string
  feature1Title: string
  feature1Desc: string
  feature2Title: string
  feature2Desc: string
  feature3Title: string
  feature3Desc: string
  feature4Title: string
  feature4Desc: string
  useCaseTitle: string
  useCase1: string
  useCase2: string
  useCase3: string
  useCase4: string
  faqTitle: string
  faq1Q: string
  faq1A: string
  faq2Q: string
  faq2A: string
  faq3Q: string
  faq3A: string
  faq4Q: string
  faq4A: string
  ctaTitle: string
  ctaSub: string
  ctaButton: string
}

async function loadCategoryCopy(locale: 'ru' | 'en', slug: CategorySlug): Promise<CategoryCopy> {
  if (locale === 'ru') {
    const messages = (await import('@/messages/ru.json')).default
    return messages.categoryPages[slug] as CategoryCopy
  }
  const messages = (await import('@/messages/en.json')).default
  return messages.categoryPages[slug] as CategoryCopy
}

function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as string[]).includes(value)
}

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isCategorySlug(slug)) {
    return {}
  }
  const currentLocale: SeoLocale = locale === 'ru' ? 'ru' : 'en'
  const copy = await loadCategoryCopy(currentLocale, slug)

  return buildLocalizedMetadata({
    locale: currentLocale,
    path: `/categories/${slug}`,
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords: getSeoKeywords(SEO_KEY[slug], currentLocale),
  })
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isCategorySlug(slug)) {
    notFound()
  }
  setRequestLocale(locale)
  const currentLocale: SeoLocale = locale === 'ru' ? 'ru' : 'en'
  const copy = await loadCategoryCopy(currentLocale, slug)

  const Icon = CATEGORY_ICONS[slug]
  const palette = CATEGORY_PALETTE[slug]
  const url = getPublicUrl(currentLocale, `/categories/${slug}`)

  const features = [
    { title: copy.feature1Title, desc: copy.feature1Desc },
    { title: copy.feature2Title, desc: copy.feature2Desc },
    { title: copy.feature3Title, desc: copy.feature3Desc },
    { title: copy.feature4Title, desc: copy.feature4Desc },
  ]

  const problemBullets = [copy.problemBullet1, copy.problemBullet2, copy.problemBullet3, copy.problemBullet4]
  const useCases = [copy.useCase1, copy.useCase2, copy.useCase3, copy.useCase4]
  const faqs = [
    { q: copy.faq1Q, a: copy.faq1A },
    { q: copy.faq2Q, a: copy.faq2A },
    { q: copy.faq3Q, a: copy.faq3A },
    { q: copy.faq4Q, a: copy.faq4A },
  ]

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: copy.eyebrow,
    name: copy.metaTitle,
    description: copy.metaDescription,
    url,
    provider: {
      '@type': 'Organization',
      name: 'Luminify',
      url: APP_URL,
    },
    areaServed: { '@type': 'Country', name: 'United States' },
    audience: {
      '@type': 'BusinessAudience',
      audienceType:
        slug === 'apparel'
          ? 'DTC apparel and fashion brands'
          : slug === 'cosmetics'
            ? 'Indie beauty and cosmetics brands'
            : 'Fine, demi-fine, and fashion jewelry brands',
    },
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: getPublicUrl(currentLocale, '/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: copy.eyebrow,
        item: url,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Script
        id={`category-${slug}-service`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Script
        id={`category-${slug}-faq`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Script
        id={`category-${slug}-breadcrumb`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-16 pt-28">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-rose-gold-100/80 via-rose-gold-50/40 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-[-5%] h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-cream-200/70 via-cream-100/30 to-transparent blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-rose-gold-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-gold-700">
                  <Icon className="h-3.5 w-3.5" />
                  {copy.eyebrow}
                </span>
                <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight text-foreground">
                  {copy.heroTitle}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                  {copy.heroSubtitle}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="group h-12 bg-primary px-7 text-white shadow-soft transition-all duration-300 hover:bg-rose-gold-600 hover:shadow-glow"
                    >
                      {copy.heroCta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/#pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 border-cream-200 bg-white px-7 text-foreground hover:border-rose-gold-200 hover:text-rose-gold-700"
                    >
                      {copy.heroSecondaryCta}
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-muted-foreground shadow-soft border border-cream-200">
                  <Sparkles className="h-3.5 w-3.5 text-rose-gold-500" />
                  {copy.heroBadge}
                </div>
              </div>

              {/* Hero visual */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-cream-200 bg-cream-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Before
                      </span>
                      <span className="text-[10px] text-muted-foreground">flat-lay</span>
                    </div>
                    <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-cream-300 bg-gradient-to-br from-cream-100 to-cream-200">
                      <span className="text-5xl opacity-40 grayscale">{palette.emoji}</span>
                    </div>
                  </div>
                  <div className={`relative overflow-hidden rounded-2xl border border-rose-gold-200 bg-gradient-to-br ${palette.from} ${palette.to} p-3`}>
                    <div className="relative z-10 mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-gold-700">
                        After AI
                      </span>
                      <span className="text-[10px] text-rose-gold-700/70">on-model</span>
                    </div>
                    <div className="flex aspect-[3/4] items-center justify-center rounded-xl border border-white/60 bg-white/80 shadow-inner backdrop-blur-sm">
                      <span className="text-6xl drop-shadow-md">{palette.emoji}</span>
                    </div>
                    <span className={`absolute -bottom-8 -right-8 h-28 w-28 rounded-full ${palette.accent} opacity-40 blur-2xl`} />
                  </div>
                </div>
                <div className="absolute -bottom-4 left-4 flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-3.5 py-2 shadow-card">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold text-foreground">5.2s</span>
                  <span className="text-[11px] text-muted-foreground">per shot</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="px-6 py-16 bg-white">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 max-w-2xl font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-tight text-foreground">
              {copy.problemTitle}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {problemBullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl border border-cream-200 bg-cream-50/40 p-5"
                >
                  <p className="text-sm leading-relaxed text-foreground">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
                {copy.featuresTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
                {copy.featuresSubtitle}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-cream-200 bg-white p-7 shadow-card"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-gold-50">
                    <Sparkles className="h-5 w-5 text-rose-gold-700" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="px-6 py-16 bg-cream-50/40">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 max-w-2xl font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-tight text-foreground">
              {copy.useCaseTitle}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {useCases.map((useCase) => (
                <li
                  key={useCase}
                  className="flex items-start gap-3 rounded-xl border border-cream-200 bg-white p-4"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-rose-gold-100">
                    <Check className="h-3 w-3 text-rose-gold-700" />
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
              {copy.faqTitle}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-cream-200 bg-white p-6 shadow-soft"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-foreground transition-colors group-hover:text-rose-gold-700">
                    {faq.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-rose-gold-200 bg-gradient-to-br from-rose-gold-50 via-white to-cream-100 p-10 text-center shadow-card sm:p-14">
              <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-gold-200/40 blur-3xl" />
              <h2 className="relative font-serif text-[clamp(1.6rem,3.2vw,2.4rem)] font-medium tracking-tight text-foreground">
                {copy.ctaTitle}
              </h2>
              <p className="relative mt-3 text-base text-muted-foreground">
                {copy.ctaSub}
              </p>
              <div className="relative mt-6 inline-flex">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="group h-12 bg-primary px-8 text-white shadow-soft transition-all duration-300 hover:bg-rose-gold-600 hover:shadow-glow"
                  >
                    {copy.ctaButton}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
