import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Script from 'next/script'
import {
  ArrowLeft,
  Database,
  FileLock2,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'
const CONTACT_EMAIL = 'arman@luminify.app'

interface PrivacySection {
  title: string
  paragraphs: string[]
  list?: string[]
}

interface PrivacyCopy {
  metaTitle: string
  metaDescription: string
  back: string
  title: string
  eyebrow: string
  intro: string
  updatedAt: string
  homeHref: string
  termsHref: string
  contactHref: string
  primaryCta: string
  secondaryCta: string
  summaryTitle: string
  summaryBody: string
  highlightsTitle: string
  highlights: string[]
  guideTitle: string
  guideBody: string
  guideNote: string
  contactTitle: string
  contactBody: string
  location: string
  sections: PrivacySection[]
}

const PRIVACY_COPY: Record<'ru' | 'en', PrivacyCopy> = {
  ru: {
    metaTitle: 'Политика конфиденциальности | Luminify',
    metaDescription:
      'Политика конфиденциальности Luminify: какие данные мы собираем, зачем обрабатываем и как с нами связаться по вопросам персональных данных.',
    back: 'Назад',
    title: 'Политика конфиденциальности',
    eyebrow: 'Конфиденциальность данных',
    intro:
      'На этой странице мы простым языком объясняем, какие данные Luminify может получать при работе сервиса, зачем они нужны и как мы обращаемся с ними. Мы стараемся собирать только то, что действительно помогает продукту работать, оплачиваться и оставаться безопасным.',
    updatedAt: 'Последнее обновление: 7 апреля 2026 года',
    homeHref: '/ru',
    termsHref: '/terms',
    contactHref: '/ru/contacts',
    primaryCta: 'Написать по данным',
    secondaryCta: 'Открыть условия',
    summaryTitle: 'Коротко о главном',
    summaryBody:
      'Мы используем данные для работы аккаунта, генерации и улучшения изображений, биллинга, безопасности сервиса и поддержки пользователей. Мы не продаём ваши персональные данные как отдельный товар.',
    highlightsTitle: 'Главные принципы',
    highlights: [
      'Мы собираем только те данные, которые нужны для работы сервиса, оплаты и поддержки.',
      'Часть обработки выполняется через инфраструктурных и AI-партнёров, необходимых для работы продукта.',
      'Вы можете написать нам по вопросам доступа, исправления или удаления данных.',
      'Мы не обещаем абсолютную безопасность, но применяем разумные технические меры защиты.',
    ],
    guideTitle: 'Что полезно посмотреть в первую очередь',
    guideBody:
      'Если вы просто хотите быстро понять суть, посмотрите разделы про какие данные собираются, как они используются, кому могут передаваться и как долго могут храниться.',
    guideNote:
      'Если нужен практический ответ по удалению данных, доступу к аккаунту или биллингу, лучше сразу написать нам на почту.',
    contactTitle: 'Вопрос по персональным данным?',
    contactBody:
      'Если у вас есть запрос по конфиденциальности, доступу к данным, исправлению информации или удалению аккаунта, напишите нам. Мы рассмотрим обращение в разумный срок с учётом характера запроса и применимых правил.',
    location: 'Астана, Казахстан',
    sections: [
      {
        title: '1. Какие данные мы можем получать',
        paragraphs: [
          'Мы можем получать данные аккаунта, такие как email, имя, данные авторизации и базовые сведения о подписке или тарифе.',
          'Если вы используете сервис по назначению, мы можем обрабатывать загруженные изображения, результаты генерации, настройки инструментов, историю использования и технические метаданные, связанные с задачей.',
          'Также могут обрабатываться технические данные, например IP-адрес, идентификаторы сессии, cookies, журналы запросов, тип браузера и общие данные об устройстве, если это нужно для безопасности, аналитики или стабильной работы сервиса.',
        ],
      },
      {
        title: '2. Зачем мы используем данные',
        paragraphs: [
          'Мы используем данные для предоставления сервиса, авторизации, сохранения результатов, работы очередей обработки, улучшения изображений, биллинга, предотвращения злоупотреблений и поддержки пользователей.',
          'Часть данных может использоваться для диагностики ошибок, мониторинга производительности, предотвращения атак, соблюдения лимитов и защиты инфраструктуры.',
          'Если вы обращаетесь в поддержку, мы можем использовать предоставленную вами информацию, чтобы ответить на запрос и решить проблему.',
        ],
      },
      {
        title: '3. Платежи и биллинг',
        paragraphs: [
          'Для платных функций мы используем платёжную инфраструктуру и биллинговых партнёров. В рамках оплаты они могут обрабатывать данные, необходимые для оформления, подтверждения и сопровождения платежей.',
          'Мы не храним полные данные банковских карт на своей стороне, если иное прямо не требуется в рамках используемой платёжной инфраструктуры.',
        ],
      },
      {
        title: '4. AI-провайдеры и обработка файлов',
        paragraphs: [
          'Для части функций изображения и связанные параметры задачи могут обрабатываться внешними AI-провайдерами и облачной инфраструктурой, если это необходимо для генерации, улучшения, редактирования или других функций сервиса.',
          'Такая обработка осуществляется в объёме, который нужен для выполнения конкретного запроса пользователя и поддержания работы продукта.',
          'Некоторые инструменты могут работать локально в браузере, а некоторые — на серверной инфраструктуре. Конкретный путь обработки зависит от выбранного инструмента и сценария использования.',
        ],
      },
      {
        title: '5. Кому данные могут передаваться',
        paragraphs: ['Мы можем передавать данные ограниченному кругу получателей, если это необходимо для работы сервиса:'],
        list: [
          'провайдерам облачной инфраструктуры и хранения данных',
          'платёжным и биллинговым партнёрам',
          'провайдерам авторизации, аналитики, мониторинга и защиты',
          'AI-провайдерам, которые помогают выполнить ваш запрос',
          'государственным органам или иным лицам, если это требуется обязательным законом или для защиты наших законных интересов',
        ],
      },
      {
        title: '6. Cookies и технические идентификаторы',
        paragraphs: [
          'Мы можем использовать cookies, локальное хранилище браузера и сходные технические механизмы для входа в аккаунт, сохранения языка, поддержания сессии, работы интерфейса и защиты от злоупотреблений.',
          'Отдельные аналитические и технические cookies могут использоваться для понимания того, как работает продукт и где возникают ошибки.',
        ],
      },
      {
        title: '7. Срок хранения данных',
        paragraphs: [
          'Мы можем хранить данные столько, сколько это разумно необходимо для работы сервиса, выполнения ваших запросов, поддержки аккаунта, соблюдения обязательств по оплате, разрешения споров и защиты инфраструктуры.',
          'Фактический срок хранения может зависеть от типа данных, тарифа, статуса аккаунта, технических ограничений, резервных копий и требований применимого права.',
          'Даже после удаления части данных отдельные фрагменты могут временно сохраняться в журналах, резервных копиях или системах безопасности в течение ограниченного времени.',
        ],
      },
      {
        title: '8. Безопасность',
        paragraphs: [
          'Мы применяем разумные технические и организационные меры, чтобы снизить риск несанкционированного доступа, утраты, изменения или неправомерного использования данных.',
          'При этом ни один онлайн-сервис не может гарантировать абсолютную безопасность, поэтому использование цифровых продуктов всегда связано с определённым остаточным риском.',
        ],
      },
      {
        title: '9. Ваши запросы и права',
        paragraphs: [
          'В зависимости от применимого законодательства вы можете обратиться к нам с запросом на доступ к данным, уточнение, исправление, обновление или удаление информации, а также по вопросам использования данных внутри сервиса.',
          'Мы можем запросить дополнительную информацию для подтверждения личности и защиты аккаунта перед выполнением чувствительных действий.',
          'Если обязательные нормы права предоставляют вам дополнительные права в сфере персональных данных, такие права сохраняют силу независимо от формулировок этой политики.',
        ],
      },
      {
        title: '10. Изменения политики',
        paragraphs: [
          'Мы можем обновлять эту политику по мере изменения продукта, инфраструктуры, состава интеграций, платёжных процессов и требований закона.',
          'Новая редакция начинает действовать с момента публикации на сайте, если прямо не указано иное.',
        ],
      },
      {
        title: '11. Контакты',
        paragraphs: ['По вопросам конфиденциальности и персональных данных вы можете написать нам:'],
      },
    ],
  },
  en: {
    metaTitle: 'Privacy Policy | Luminify',
    metaDescription:
      'Privacy policy for Luminify: what data we may collect, why we process it, and how to contact us about personal data matters.',
    back: 'Back',
    title: 'Privacy Policy',
    eyebrow: 'Data privacy',
    intro:
      'This page explains in plain language what kinds of data Luminify may receive while the service is being used, why that data may be needed, and how we handle it. We aim to collect only what is reasonably necessary for the product to work, stay secure, and support billing and support operations.',
    updatedAt: 'Last updated: April 7, 2026',
    homeHref: '/',
    termsHref: '/terms',
    contactHref: '/contacts',
    primaryCta: 'Contact us about privacy',
    secondaryCta: 'Open terms',
    summaryTitle: 'The short version',
    summaryBody:
      'We use data to run accounts, process generation and enhancement requests, support billing, protect the service, and help users. We do not sell personal data as a standalone asset.',
    highlightsTitle: 'Core principles',
    highlights: [
      'We collect data needed for service operation, payments, security, and support.',
      'Some processing is handled through infrastructure and AI partners required for the product to work.',
      'You can contact us about access, correction, or deletion requests.',
      'We apply reasonable safeguards, but we do not promise absolute security.',
    ],
    guideTitle: 'What to review first',
    guideBody:
      'If you want the practical overview first, start with the sections on what data may be collected, how it is used, who it may be shared with, and how long it may be kept.',
    guideNote:
      'If you need a practical answer about deletion, account access, or billing-related data, the fastest path is to email us directly.',
    contactTitle: 'Questions about personal data?',
    contactBody:
      'If you have a privacy request about access, correction, account deletion, or data handling, send us a message. We will review it within a reasonable time based on the nature of the request and applicable rules.',
    location: 'Astana, Kazakhstan',
    sections: [
      {
        title: '1. What data we may receive',
        paragraphs: [
          'We may receive account information such as email address, name, authentication details, and basic subscription or plan information.',
          'When you use the service as intended, we may process uploaded images, generated outputs, tool settings, usage history, and technical metadata associated with a task.',
          'We may also process technical data such as IP address, session identifiers, cookies, request logs, browser type, and general device data where needed for security, analytics, or service stability.',
        ],
      },
      {
        title: '2. Why we use data',
        paragraphs: [
          'We use data to provide the service, authenticate users, store outputs, run processing queues, enhance images, support billing, prevent abuse, and respond to support requests.',
          'Some data may also be used for error diagnostics, performance monitoring, attack prevention, usage limit enforcement, and infrastructure protection.',
          'If you contact support, we may use the information you provide to answer your request and resolve the issue.',
        ],
      },
      {
        title: '3. Payments and billing',
        paragraphs: [
          'For paid features, we use payment and billing partners. As part of the checkout and subscription flow, they may process data needed to authorize, confirm, and support payments.',
          'We do not store full payment card details on our side unless this is explicitly required within the payment infrastructure being used.',
        ],
      },
      {
        title: '4. AI providers and file processing',
        paragraphs: [
          'For some features, images and related task parameters may be processed by external AI providers and cloud infrastructure when this is necessary to generate, enhance, edit, or otherwise fulfill a user request.',
          'That processing is carried out only to the extent reasonably needed to complete the requested workflow and operate the product.',
          'Some tools may run locally in the browser, while others use server-side infrastructure. The exact processing path depends on the selected tool and use case.',
        ],
      },
      {
        title: '5. Who data may be shared with',
        paragraphs: ['We may share data with a limited set of recipients when necessary for the service to operate:'],
        list: [
          'cloud infrastructure and storage providers',
          'payment and billing partners',
          'authentication, analytics, monitoring, and protection providers',
          'AI providers that help fulfill your request',
          'public authorities or other parties where required by mandatory law or to protect our legitimate interests',
        ],
      },
      {
        title: '6. Cookies and technical identifiers',
        paragraphs: [
          'We may use cookies, browser local storage, and similar technical mechanisms for account login, language preference, session continuity, interface behavior, and abuse prevention.',
          'Certain analytical and technical cookies may also be used to understand how the product performs and where errors occur.',
        ],
      },
      {
        title: '7. Data retention',
        paragraphs: [
          'We may retain data for as long as reasonably necessary to operate the service, fulfill your requests, maintain the account, support billing obligations, resolve disputes, and protect the infrastructure.',
          'Actual retention periods may depend on the type of data, your plan, account status, technical constraints, backup systems, and applicable legal requirements.',
          'Even after some data is deleted, limited fragments may temporarily remain in logs, backups, or security systems for a restricted period.',
        ],
      },
      {
        title: '8. Security',
        paragraphs: [
          'We apply reasonable technical and organizational measures intended to reduce the risk of unauthorized access, loss, alteration, or misuse of data.',
          'At the same time, no online service can guarantee absolute security, so some residual risk always exists when using digital products.',
        ],
      },
      {
        title: '9. Your requests and rights',
        paragraphs: [
          'Depending on applicable law, you may contact us regarding access to your data, correction, updates, deletion, or questions about how data is used in the service.',
          'We may request additional information to verify identity and protect the account before carrying out sensitive actions.',
          'If mandatory law grants you additional personal data rights, those rights remain in force regardless of the wording of this policy.',
        ],
      },
      {
        title: '10. Changes to this policy',
        paragraphs: [
          'We may update this policy as the product, infrastructure, integrations, payment flows, and legal requirements evolve.',
          'A new version becomes effective upon publication on the site unless stated otherwise.',
        ],
      },
      {
        title: '11. Contact',
        paragraphs: ['For privacy and personal data questions, you may contact us at:'],
      },
    ],
  },
}

async function getCurrentLocale(): Promise<'ru' | 'en'> {
  const cookieStore = await cookies()
  return cookieStore.get('NEXT_LOCALE')?.value === 'ru' ? 'ru' : 'en'
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale()
  const copy = PRIVACY_COPY[locale]

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: `${APP_URL}/privacy`,
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: `${APP_URL}/privacy`,
      type: 'website',
    },
  }
}

export default async function PrivacyPage() {
  const locale = await getCurrentLocale()
  const copy = PRIVACY_COPY[locale]

  const privacySchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: copy.metaTitle,
    description: copy.metaDescription,
    url: `${APP_URL}/privacy`,
    about: {
      '@type': 'Thing',
      name: copy.title,
    },
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Script
        id="privacy-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }}
      />

      <header className="sticky top-0 z-20 border-b border-cream-200/80 bg-[#FAF9F6]/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href={copy.homeHref}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.back}
            </Link>
            <div className="h-4 w-px bg-cream-300" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-rose-gold">
                <span className="font-serif text-xs font-bold text-white">L</span>
              </div>
              <span className="font-serif text-base font-semibold tracking-tight text-foreground">
                Luminify
              </span>
            </div>
          </div>

          <Link
            href={copy.contactHref}
            className="hidden h-10 items-center justify-center rounded-xl border border-cream-200 bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700 sm:inline-flex"
          >
            {copy.primaryCta}
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-12 pt-16 sm:pt-20">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-10 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-rose-gold-100/80 via-rose-gold-50/40 to-transparent blur-3xl" />
            <div className="absolute bottom-[-5%] right-[-5%] h-[520px] w-[520px] rounded-full bg-gradient-to-tl from-cream-200/70 via-cream-100/40 to-transparent blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2rem] border border-cream-200 bg-white/90 p-8 shadow-card backdrop-blur sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-gold-200 bg-rose-gold-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-gold-700">
                <FileLock2 className="h-3.5 w-3.5" />
                {copy.eyebrow}
              </span>
              <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4.8vw,3.6rem)] font-medium leading-tight tracking-tight text-foreground">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {copy.intro}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                >
                  {copy.primaryCta}
                </a>
                <Link
                  href={copy.termsHref}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-cream-200 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                >
                  {copy.secondaryCta}
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <div className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-gold-600" />
                  {copy.updatedAt}
                </div>
                <h2 className="mt-5 font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.summaryTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.summaryBody}
                </p>
              </div>

              <div className="rounded-[2rem] border border-rose-gold-200 bg-gradient-to-br from-rose-gold-50/80 via-white to-cream-50 p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.highlightsTitle}
                </h2>
                <ul className="mt-4 space-y-3">
                  {copy.highlights.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-gold-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.guideTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.guideBody}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-rose-gold-700">
                  {copy.guideNote}
                </p>
              </div>

              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {copy.contactTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {copy.contactBody}
                </p>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-gold-600" />
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-foreground transition-colors hover:text-rose-gold-700"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-gold-600" />
                    <span className="text-foreground">{copy.location}</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="grid gap-5">
              {copy.sections.map((section, index) => (
                <SectionCard key={section.title} title={section.title}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.list && (
                    <ul>
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {index === copy.sections.length - 1 && (
                    <div className="mt-4 rounded-2xl border border-rose-gold-200 bg-rose-gold-50/70 p-5">
                      <p className="text-sm text-muted-foreground">
                        Email:{' '}
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="font-medium text-foreground transition-colors hover:text-rose-gold-700"
                        >
                          {CONTACT_EMAIL}
                        </a>
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {copy.location}
                      </p>
                    </div>
                  )}
                </SectionCard>
              ))}

              <div className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-cream-100">
                    <Database className="h-5 w-5 text-rose-gold-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
                      {copy.contactTitle}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                      {copy.contactBody}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      <Link
                        href={copy.contactHref}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-cream-200 bg-white px-6 text-sm font-medium text-foreground transition-colors hover:border-rose-gold-200 hover:text-rose-gold-700"
                      >
                        {copy.primaryCta}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-cream-200 bg-white p-7 shadow-soft">
      <h2 className="font-serif text-2xl font-medium tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
