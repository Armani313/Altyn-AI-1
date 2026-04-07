import type { Metadata } from 'next'
import Script from 'next/script'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale, APP_URL } from '@/lib/seo'

const DISPLAY_EMAIL = 'Arman@luminify.app'
const EMAIL_HREF = 'arman@luminify.app'
const PHONE_DISPLAY = '+7 775 333 12 34'
const PHONE_HREF = '+77753331234'

const FOUNDER_NAME: Record<'ru' | 'en', string> = {
  ru: 'Нурай Сагатбек',
  en: 'Nuray Sagatbek',
}

const FOUNDER_CITY: Record<'ru' | 'en', string> = {
  ru: 'Астана',
  en: 'Astana',
}

interface AboutPageCopy {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  heroTitle: string
  heroSubtitle: string
  storyTitle: string
  storyBody1: string
  storyBody2: string
  founderTitle: string
  founderRole: string
  founderNote: string
  cityLabel: string
  phoneLabel: string
  emailLabel: string
  missionTitle: string
  missionBody: string
  primaryCta: string
  secondaryCta: string
}

async function loadAboutPageCopy(locale: 'ru' | 'en'): Promise<AboutPageCopy> {
  if (locale === 'ru') {
    return (await import('@/messages/ru.json')).default.aboutPage as AboutPageCopy
  }

  return (await import('@/messages/en.json')).default.aboutPage as AboutPageCopy
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  const copy = await loadAboutPageCopy(currentLocale)

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/about',
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords: getSeoKeywords('about', currentLocale as SeoLocale),
  })
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  setRequestLocale(locale)

  const copy = await loadAboutPageCopy(currentLocale)
  const founderName = FOUNDER_NAME[currentLocale]
  const founderCity = FOUNDER_CITY[currentLocale]

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: copy.metaTitle,
    url: currentLocale === 'ru' ? `${APP_URL}/ru/about` : `${APP_URL}/about`,
    mainEntity: {
      '@type': 'Person',
      name: founderName,
      jobTitle: copy.founderRole,
      email: EMAIL_HREF,
      telephone: PHONE_HREF,
      address: {
        '@type': 'PostalAddress',
        addressLocality: founderCity,
        addressCountry: 'KZ',
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Script
        id="about-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <Navbar />
      <main>
        <section className="relative overflow-hidden px-6 pb-12 pt-28">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-16 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-rose-gold-100/80 via-rose-gold-50/40 to-transparent blur-3xl" />
            <div className="absolute bottom-0 right-[-5%] h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-cream-200/70 via-cream-100/30 to-transparent blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-cream-200 bg-white/90 p-8 shadow-card backdrop-blur sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-rose-gold-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-gold-700">
                {copy.eyebrow}
              </span>
              <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-tight tracking-tight text-foreground">
                {copy.heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {copy.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-cream-200 bg-white p-8 shadow-soft sm:p-10">
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-medium tracking-tight text-foreground">
                {copy.storyTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {copy.storyBody1}
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {copy.storyBody2}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${EMAIL_HREF}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                >
                  {copy.primaryCta}
                </a>
                <Link
                  href="/contacts"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-cream-200 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                >
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.founderTitle}
                </h2>
                <p className="mt-3 text-lg font-medium text-foreground">
                  {founderName}
                </p>
                <p className="mt-1 text-sm text-rose-gold-700">
                  {copy.founderRole}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {copy.founderNote}
                </p>

                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-gold-700">
                      {copy.cityLabel}
                    </dt>
                    <dd className="mt-1 text-foreground">{founderCity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-gold-700">
                      {copy.phoneLabel}
                    </dt>
                    <dd className="mt-1">
                      <a href={`tel:${PHONE_HREF}`} className="text-foreground transition-colors hover:text-rose-gold-700">
                        {PHONE_DISPLAY}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-gold-700">
                      {copy.emailLabel}
                    </dt>
                    <dd className="mt-1">
                      <a href={`mailto:${EMAIL_HREF}`} className="text-foreground transition-colors hover:text-rose-gold-700">
                        {DISPLAY_EMAIL}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.missionTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.missionBody}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
