import type { Metadata } from 'next'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import {
  ShoppingBag,
  Flower2,
  Gem,
  Check,
  Sparkles,
  ArrowRight,
  Upload,
  Users,
  ImageIcon,
  X as XIcon,
  Star,
  Quote,
} from 'lucide-react'
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
  problemBullet5?: string
  problemBullet6?: string
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
  feature5Title?: string
  feature5Desc?: string
  feature6Title?: string
  feature6Desc?: string
  useCaseTitle: string
  useCase1: string
  useCase2: string
  useCase3: string
  useCase4: string
  useCase5?: string
  useCase6?: string
  faqTitle: string
  faq1Q: string
  faq1A: string
  faq2Q: string
  faq2A: string
  faq3Q: string
  faq3A: string
  faq4Q: string
  faq4A: string
  faq5Q?: string
  faq5A?: string
  faq6Q?: string
  faq6A?: string
  faq7Q?: string
  faq7A?: string
  faq8Q?: string
  faq8A?: string
  faq9Q?: string
  faq9A?: string
  faq10Q?: string
  faq10A?: string
  ctaTitle: string
  ctaSub: string
  ctaButton: string
  // Optional expanded sections (jewelry uses these)
  trustBarLabel?: string
  trustPlatform1?: string
  trustPlatform2?: string
  trustPlatform3?: string
  trustPlatform4?: string
  trustPlatform5?: string
  trustStat1Value?: string
  trustStat1Label?: string
  trustStat2Value?: string
  trustStat2Label?: string
  trustStat3Value?: string
  trustStat3Label?: string
  trustStat4Value?: string
  trustStat4Label?: string
  howItWorksTitle?: string
  howItWorksSubtitle?: string
  howItWorksStep1Title?: string
  howItWorksStep1Desc?: string
  howItWorksStep2Title?: string
  howItWorksStep2Desc?: string
  howItWorksStep3Title?: string
  howItWorksStep3Desc?: string
  galleryTitle?: string
  gallerySubtitle?: string
  galleryItem1Label?: string
  galleryItem1Hint?: string
  galleryItem2Label?: string
  galleryItem2Hint?: string
  galleryItem3Label?: string
  galleryItem3Hint?: string
  galleryItem4Label?: string
  galleryItem4Hint?: string
  galleryItem5Label?: string
  galleryItem5Hint?: string
  galleryItem6Label?: string
  galleryItem6Hint?: string
  comparisonTitle?: string
  comparisonSubtitle?: string
  comparisonHeaderTrad?: string
  comparisonHeaderLum?: string
  comparisonRow1Label?: string
  comparisonRow1Trad?: string
  comparisonRow1Lum?: string
  comparisonRow2Label?: string
  comparisonRow2Trad?: string
  comparisonRow2Lum?: string
  comparisonRow3Label?: string
  comparisonRow3Trad?: string
  comparisonRow3Lum?: string
  comparisonRow4Label?: string
  comparisonRow4Trad?: string
  comparisonRow4Lum?: string
  comparisonRow5Label?: string
  comparisonRow5Trad?: string
  comparisonRow5Lum?: string
  comparisonRow6Label?: string
  comparisonRow6Trad?: string
  comparisonRow6Lum?: string
  testimonialsTitle?: string
  testimonialsSubtitle?: string
  testimonial1Quote?: string
  testimonial1Author?: string
  testimonial1Role?: string
  testimonial2Quote?: string
  testimonial2Author?: string
  testimonial2Role?: string
  testimonial3Quote?: string
  testimonial3Author?: string
  testimonial3Role?: string
  pricingTitle?: string
  pricingSubtitle?: string
  pricingTier1Name?: string
  pricingTier1Price?: string
  pricingTier1Period?: string
  pricingTier1Desc?: string
  pricingTier2Name?: string
  pricingTier2Price?: string
  pricingTier2Period?: string
  pricingTier2Desc?: string
  pricingTier2Badge?: string
  pricingTier3Name?: string
  pricingTier3Price?: string
  pricingTier3Period?: string
  pricingTier3Desc?: string
  pricingCta?: string
  stickyCtaText?: string
  stickyCtaButton?: string
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
    ...(copy.feature5Title && copy.feature5Desc
      ? [{ title: copy.feature5Title, desc: copy.feature5Desc }]
      : []),
    ...(copy.feature6Title && copy.feature6Desc
      ? [{ title: copy.feature6Title, desc: copy.feature6Desc }]
      : []),
  ]

  const problemBullets = [
    copy.problemBullet1,
    copy.problemBullet2,
    copy.problemBullet3,
    copy.problemBullet4,
    ...(copy.problemBullet5 ? [copy.problemBullet5] : []),
    ...(copy.problemBullet6 ? [copy.problemBullet6] : []),
  ]

  const useCases = [
    copy.useCase1,
    copy.useCase2,
    copy.useCase3,
    copy.useCase4,
    ...(copy.useCase5 ? [copy.useCase5] : []),
    ...(copy.useCase6 ? [copy.useCase6] : []),
  ]

  const faqs = [
    { q: copy.faq1Q, a: copy.faq1A },
    { q: copy.faq2Q, a: copy.faq2A },
    { q: copy.faq3Q, a: copy.faq3A },
    { q: copy.faq4Q, a: copy.faq4A },
    ...(copy.faq5Q && copy.faq5A ? [{ q: copy.faq5Q, a: copy.faq5A }] : []),
    ...(copy.faq6Q && copy.faq6A ? [{ q: copy.faq6Q, a: copy.faq6A }] : []),
    ...(copy.faq7Q && copy.faq7A ? [{ q: copy.faq7Q, a: copy.faq7A }] : []),
    ...(copy.faq8Q && copy.faq8A ? [{ q: copy.faq8Q, a: copy.faq8A }] : []),
    ...(copy.faq9Q && copy.faq9A ? [{ q: copy.faq9Q, a: copy.faq9A }] : []),
    ...(copy.faq10Q && copy.faq10A ? [{ q: copy.faq10Q, a: copy.faq10A }] : []),
  ]

  const platforms = [
    copy.trustPlatform1,
    copy.trustPlatform2,
    copy.trustPlatform3,
    copy.trustPlatform4,
    copy.trustPlatform5,
  ].filter((v): v is string => Boolean(v))

  const stats = [
    copy.trustStat1Value && copy.trustStat1Label
      ? { value: copy.trustStat1Value, label: copy.trustStat1Label }
      : null,
    copy.trustStat2Value && copy.trustStat2Label
      ? { value: copy.trustStat2Value, label: copy.trustStat2Label }
      : null,
    copy.trustStat3Value && copy.trustStat3Label
      ? { value: copy.trustStat3Value, label: copy.trustStat3Label }
      : null,
    copy.trustStat4Value && copy.trustStat4Label
      ? { value: copy.trustStat4Value, label: copy.trustStat4Label }
      : null,
  ].filter((v): v is { value: string; label: string } => v !== null)

  const hasTrustBar = (platforms.length > 0 || stats.length > 0) && Boolean(copy.trustBarLabel)

  const howItWorksSteps =
    copy.howItWorksTitle && copy.howItWorksStep1Title
      ? [
          {
            icon: Upload,
            title: copy.howItWorksStep1Title,
            desc: copy.howItWorksStep1Desc ?? '',
          },
          {
            icon: Users,
            title: copy.howItWorksStep2Title ?? '',
            desc: copy.howItWorksStep2Desc ?? '',
          },
          {
            icon: ImageIcon,
            title: copy.howItWorksStep3Title ?? '',
            desc: copy.howItWorksStep3Desc ?? '',
          },
        ]
      : []

  const galleryItems = [
    copy.galleryItem1Label
      ? { label: copy.galleryItem1Label, hint: copy.galleryItem1Hint ?? '' }
      : null,
    copy.galleryItem2Label
      ? { label: copy.galleryItem2Label, hint: copy.galleryItem2Hint ?? '' }
      : null,
    copy.galleryItem3Label
      ? { label: copy.galleryItem3Label, hint: copy.galleryItem3Hint ?? '' }
      : null,
    copy.galleryItem4Label
      ? { label: copy.galleryItem4Label, hint: copy.galleryItem4Hint ?? '' }
      : null,
    copy.galleryItem5Label
      ? { label: copy.galleryItem5Label, hint: copy.galleryItem5Hint ?? '' }
      : null,
    copy.galleryItem6Label
      ? { label: copy.galleryItem6Label, hint: copy.galleryItem6Hint ?? '' }
      : null,
  ].filter((v): v is { label: string; hint: string } => v !== null)

  const comparisonRows = [
    copy.comparisonRow1Label
      ? {
          label: copy.comparisonRow1Label,
          trad: copy.comparisonRow1Trad ?? '',
          lum: copy.comparisonRow1Lum ?? '',
        }
      : null,
    copy.comparisonRow2Label
      ? {
          label: copy.comparisonRow2Label,
          trad: copy.comparisonRow2Trad ?? '',
          lum: copy.comparisonRow2Lum ?? '',
        }
      : null,
    copy.comparisonRow3Label
      ? {
          label: copy.comparisonRow3Label,
          trad: copy.comparisonRow3Trad ?? '',
          lum: copy.comparisonRow3Lum ?? '',
        }
      : null,
    copy.comparisonRow4Label
      ? {
          label: copy.comparisonRow4Label,
          trad: copy.comparisonRow4Trad ?? '',
          lum: copy.comparisonRow4Lum ?? '',
        }
      : null,
    copy.comparisonRow5Label
      ? {
          label: copy.comparisonRow5Label,
          trad: copy.comparisonRow5Trad ?? '',
          lum: copy.comparisonRow5Lum ?? '',
        }
      : null,
    copy.comparisonRow6Label
      ? {
          label: copy.comparisonRow6Label,
          trad: copy.comparisonRow6Trad ?? '',
          lum: copy.comparisonRow6Lum ?? '',
        }
      : null,
  ].filter(
    (v): v is { label: string; trad: string; lum: string } => v !== null,
  )

  const testimonials = [
    copy.testimonial1Quote
      ? {
          quote: copy.testimonial1Quote,
          author: copy.testimonial1Author ?? '',
          role: copy.testimonial1Role ?? '',
        }
      : null,
    copy.testimonial2Quote
      ? {
          quote: copy.testimonial2Quote,
          author: copy.testimonial2Author ?? '',
          role: copy.testimonial2Role ?? '',
        }
      : null,
    copy.testimonial3Quote
      ? {
          quote: copy.testimonial3Quote,
          author: copy.testimonial3Author ?? '',
          role: copy.testimonial3Role ?? '',
        }
      : null,
  ].filter(
    (v): v is { quote: string; author: string; role: string } => v !== null,
  )

  const pricingTiers = [
    copy.pricingTier1Name
      ? {
          name: copy.pricingTier1Name,
          price: copy.pricingTier1Price ?? '',
          period: copy.pricingTier1Period ?? '',
          desc: copy.pricingTier1Desc ?? '',
          badge: undefined as string | undefined,
        }
      : null,
    copy.pricingTier2Name
      ? {
          name: copy.pricingTier2Name,
          price: copy.pricingTier2Price ?? '',
          period: copy.pricingTier2Period ?? '',
          desc: copy.pricingTier2Desc ?? '',
          badge: copy.pricingTier2Badge,
        }
      : null,
    copy.pricingTier3Name
      ? {
          name: copy.pricingTier3Name,
          price: copy.pricingTier3Price ?? '',
          period: copy.pricingTier3Period ?? '',
          desc: copy.pricingTier3Desc ?? '',
          badge: undefined as string | undefined,
        }
      : null,
  ].filter(
    (v): v is {
      name: string
      price: string
      period: string
      desc: string
      badge: string | undefined
    } => v !== null,
  )

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
    ...(testimonials.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: String(testimonials.length * 47),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    ...(pricingTiers.length > 0 && {
      offers: pricingTiers.map((tier) => ({
        '@type': 'Offer',
        name: tier.name,
        description: tier.desc,
        price: tier.price.replace(/[^0-9.]/g, ''),
        priceCurrency: 'USD',
      })),
    }),
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

  const galleryLd =
    galleryItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: copy.galleryTitle,
          itemListElement: galleryItems.map((item, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: item.label,
            description: item.hint,
          })),
        }
      : null

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
      {galleryLd && (
        <Script
          id={`category-${slug}-gallery`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryLd) }}
        />
      )}

      <Navbar />

      <main className="pb-24 sm:pb-0">
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

        {/* Trust bar */}
        {hasTrustBar && (
          <section className="border-y border-cream-200 bg-white px-6 py-10">
            <div className="mx-auto max-w-6xl">
              {copy.trustBarLabel && (
                <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {copy.trustBarLabel}
                </p>
              )}
              {platforms.length > 0 && (
                <div className="mb-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
                  {platforms.map((p) => (
                    <span
                      key={p}
                      className="font-serif text-base font-medium tracking-tight text-foreground/70 sm:text-lg"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4 text-center"
                    >
                      <div className="font-serif text-2xl font-semibold text-rose-gold-700 sm:text-3xl">
                        {s.value}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Problem */}
        <section className="px-6 py-16 bg-white">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 max-w-2xl font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-tight text-foreground">
              {copy.problemTitle}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* How it works */}
        {howItWorksSteps.length > 0 && (
          <section className="px-6 py-20 bg-cream-50/40">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 text-center">
                <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
                  {copy.howItWorksTitle}
                </h2>
                {copy.howItWorksSubtitle && (
                  <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
                    {copy.howItWorksSubtitle}
                  </p>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {howItWorksSteps.map((step, idx) => {
                  const StepIcon = step.icon
                  return (
                    <div
                      key={step.title}
                      className="relative rounded-3xl border border-cream-200 bg-white p-7 shadow-card"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-rose-gold text-white shadow-soft">
                          <StepIcon className="h-5 w-5" />
                        </div>
                        <span className="font-serif text-3xl font-light text-rose-gold-300">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className="mb-2 font-serif text-xl font-medium text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Sample gallery */}
        {galleryItems.length > 0 && (
          <section className="px-6 py-20 bg-white">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 text-center">
                <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
                  {copy.galleryTitle}
                </h2>
                {copy.gallerySubtitle && (
                  <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
                    {copy.gallerySubtitle}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {galleryItems.map((item) => (
                  <div
                    key={item.label}
                    className={`group relative overflow-hidden rounded-2xl border border-rose-gold-100 bg-gradient-to-br ${palette.from} ${palette.to} aspect-[3/4] shadow-card transition-all hover:shadow-glow`}
                  >
                    <div aria-hidden className="absolute inset-0 flex items-center justify-center">
                      <span className="text-7xl opacity-50 transition-transform duration-500 group-hover:scale-110">
                        {palette.emoji}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent p-4">
                      <div className="text-sm font-semibold text-white drop-shadow-sm">
                        {item.label}
                      </div>
                      {item.hint && (
                        <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/85">
                          {item.hint}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comparison table */}
        {comparisonRows.length > 0 && (
          <section className="px-6 py-20">
            <div className="mx-auto max-w-5xl">
              <div className="mb-10 text-center">
                <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
                  {copy.comparisonTitle}
                </h2>
                {copy.comparisonSubtitle && (
                  <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
                    {copy.comparisonSubtitle}
                  </p>
                )}
              </div>

              <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
                <div className="grid grid-cols-3 border-b border-cream-200 bg-cream-50/60">
                  <div className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6" />
                  <div className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                    {copy.comparisonHeaderTrad}
                  </div>
                  <div className="px-4 py-4 text-center text-[11px] font-semibold uppercase tracking-wider text-rose-gold-700 sm:px-6">
                    {copy.comparisonHeaderLum}
                  </div>
                </div>
                {comparisonRows.map((row, idx) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-3 ${idx > 0 ? 'border-t border-cream-200' : ''}`}
                  >
                    <div className="px-4 py-4 text-sm font-medium text-foreground sm:px-6">
                      {row.label}
                    </div>
                    <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-muted-foreground sm:px-6">
                      <XIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
                      <span>{row.trad}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-rose-gold-50/30 px-4 py-4 text-sm font-semibold text-rose-gold-800 sm:px-6">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 text-rose-gold-700" />
                      <span>{row.lum}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Use cases */}
        <section className="px-6 py-16 bg-cream-50/40">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 max-w-2xl font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-tight text-foreground">
              {copy.useCaseTitle}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section className="px-6 py-20 bg-white">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
                  {copy.testimonialsTitle}
                </h2>
                {copy.testimonialsSubtitle && (
                  <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
                    {copy.testimonialsSubtitle}
                  </p>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {testimonials.map((t) => (
                  <figure
                    key={t.author}
                    className="relative rounded-3xl border border-cream-200 bg-cream-50/40 p-7 shadow-soft"
                  >
                    <Quote className="absolute right-5 top-5 h-6 w-6 text-rose-gold-200" />
                    <div className="mb-3 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-rose-gold-500 text-rose-gold-500" />
                      ))}
                    </div>
                    <blockquote className="text-sm leading-relaxed text-foreground">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-5 border-t border-cream-200 pt-4">
                      <div className="text-sm font-semibold text-foreground">{t.author}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{t.role}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pricing snapshot */}
        {pricingTiers.length > 0 && (
          <section className="px-6 py-20">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <h2 className="font-serif text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium tracking-tight text-foreground">
                  {copy.pricingTitle}
                </h2>
                {copy.pricingSubtitle && (
                  <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
                    {copy.pricingSubtitle}
                  </p>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {pricingTiers.map((tier) => {
                  const isFeatured = Boolean(tier.badge)
                  return (
                    <div
                      key={tier.name}
                      className={`relative rounded-3xl border p-7 shadow-card transition-all ${
                        isFeatured
                          ? 'border-rose-gold-300 bg-gradient-to-br from-white to-rose-gold-50 shadow-glow scale-[1.02]'
                          : 'border-cream-200 bg-white'
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-soft">
                          {tier.badge}
                        </span>
                      )}
                      <h3 className="font-serif text-xl font-medium text-foreground">
                        {tier.name}
                      </h3>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="font-serif text-4xl font-semibold text-foreground">
                          {tier.price}
                        </span>
                        {tier.period && (
                          <span className="text-sm text-muted-foreground">{tier.period}</span>
                        )}
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {tier.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
              {copy.pricingCta && (
                <div className="mt-10 text-center">
                  <Link href="/#pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 border-cream-200 bg-white px-7 text-foreground hover:border-rose-gold-200 hover:text-rose-gold-700"
                    >
                      {copy.pricingCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="px-6 py-20 bg-cream-50/40">
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

      {/* Sticky mobile CTA */}
      {copy.stickyCtaText && copy.stickyCtaButton && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <span className="flex-1 text-xs font-medium text-foreground">
              {copy.stickyCtaText}
            </span>
            <Link href="/register" className="flex-shrink-0">
              <Button
                size="sm"
                className="h-10 bg-primary px-4 text-white shadow-soft hover:bg-rose-gold-600"
              >
                {copy.stickyCtaButton}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
