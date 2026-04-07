import type { Metadata } from 'next'
import Script from 'next/script'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { buildLocalizedMetadata, getSeoKeywords, type SeoLocale, APP_URL } from '@/lib/seo'

const MANAGER_EMAIL = 'arman@luminify.app'

interface ContactPageCopy {
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroSubtitle: string
  managerTitle: string
  managerBody: string
  managerLabel: string
  responseTitle: string
  responseBody: string
  locationTitle: string
  locationBody: string
  primaryCta: string
  secondaryCta: string
}

async function loadContactPageCopy(locale: 'ru' | 'en'): Promise<ContactPageCopy> {
  if (locale === 'ru') {
    return (await import('@/messages/ru.json')).default.contactsPage as ContactPageCopy
  }

  return (await import('@/messages/en.json')).default.contactsPage as ContactPageCopy
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  const copy = await loadContactPageCopy(currentLocale)

  return buildLocalizedMetadata({
    locale: currentLocale as SeoLocale,
    path: '/contacts',
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords: getSeoKeywords('contacts', currentLocale as SeoLocale),
  })
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const currentLocale = locale === 'ru' ? 'ru' : 'en'
  setRequestLocale(locale)

  const copy = await loadContactPageCopy(currentLocale)
  const tFooter = await getTranslations({ locale: currentLocale, namespace: 'footer' })

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: copy.metaTitle,
    url: currentLocale === 'ru' ? `${APP_URL}/ru/contacts` : `${APP_URL}/contacts`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Luminify',
      email: MANAGER_EMAIL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Astana',
        addressCountry: 'KZ',
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Script
        id="contacts-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
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
                {tFooter('contact')}
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
                {copy.managerTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {copy.managerBody}
              </p>

              <div className="mt-6 rounded-2xl border border-rose-gold-200 bg-rose-gold-50/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-gold-700">
                  {copy.managerLabel}
                </p>
                <a
                  href={`mailto:${MANAGER_EMAIL}`}
                  className="mt-2 inline-flex text-lg font-medium text-foreground transition-colors hover:text-rose-gold-700"
                >
                  {MANAGER_EMAIL}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${MANAGER_EMAIL}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                >
                  {copy.primaryCta}
                </a>
                <Link
                  href="/faq"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-cream-200 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                >
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.responseTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.responseBody}
                </p>
              </div>

              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.locationTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.locationBody}
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
