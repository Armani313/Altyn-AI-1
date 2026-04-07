import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Script from 'next/script'
import {
  ArrowLeft,
  CircleHelp,
  FileText,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'
const CONTACT_EMAIL = 'arman@luminify.app'

interface TermsSection {
  title: string
  paragraphs: string[]
  list?: string[]
}

interface TermsCopy {
  metaTitle: string
  metaDescription: string
  back: string
  title: string
  eyebrow: string
  intro: string
  updatedAt: string
  homeHref: string
  faqHref: string
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
  sections: TermsSection[]
}

const TERMS_COPY: Record<'ru' | 'en', TermsCopy> = {
  ru: {
    metaTitle: 'Условия использования | Luminify',
    metaDescription: 'Условия использования сервиса Luminify для работы с генерацией, улучшением и подготовкой изображений.',
    back: 'Назад',
    title: 'Условия использования',
    eyebrow: 'Правила сервиса',
    intro:
      'Здесь собраны основные правила работы с Luminify. Мы написали их простым языком: чтобы было понятно, как использовать сервис, что важно проверять перед публикацией и где проходят разумные границы нашей ответственности.',
    updatedAt: 'Последнее обновление: 7 апреля 2026 года',
    homeHref: '/ru',
    faqHref: '/ru/faq',
    contactHref: '/ru/contacts',
    primaryCta: 'Связаться с менеджером',
    secondaryCta: 'Открыть FAQ',
    summaryTitle: 'Коротко о главном',
    summaryBody:
      'Luminify помогает готовить изображения для каталога, рекламы и маркетплейсов, но финальную проверку результата перед публикацией всегда делает пользователь.',
    highlightsTitle: 'На что стоит обратить внимание',
    highlights: [
      'Вы сохраняете права на свои исходные изображения.',
      'Результаты ИИ нужно проверять перед публикацией и запуском рекламы.',
      'Мы можем обновлять функции и лимиты сервиса по мере развития продукта.',
      'Обязательные права пользователя по применимому закону сохраняют силу.',
    ],
    guideTitle: 'Как читать эту страницу',
    guideBody:
      'Сначала посмотрите общие правила и права на контент, затем разделы про оплату, AI-результаты и ограничения ответственности. Так проще быстро понять, как сервис устроен с деловой стороны.',
    guideNote:
      'Если нужен человеческий ответ по условиям, оплате или доступу, лучше сразу написать менеджеру.',
    contactTitle: 'Нужна помощь по условиям или оплате?',
    contactBody:
      'Если у вас есть вопрос по использованию сервиса, оплате, ограничениям или работе аккаунта, напишите нам. Мы поможем разобраться по-человечески.',
    sections: [
      {
        title: '1. Общие положения',
        paragraphs: [
          'Настоящие Условия использования регулируют доступ к сервису Luminify и его использование.',
          'Используя сервис, вы соглашаетесь с этими условиями. Если вы не согласны с ними, пожалуйста, не используйте сервис.',
          'Если отдельные права пользователя прямо защищены обязательными нормами применимого законодательства, такие права имеют приоритет над настоящими условиями в соответствующей части.',
        ],
      },
      {
        title: '2. Описание сервиса',
        paragraphs: [
          'Luminify — это онлайн-сервис для создания, улучшения и подготовки коммерческих изображений с помощью ИИ.',
          'Сервис предназначен для магазинов, брендов и команд, которым нужен быстрый визуальный контент для каталога, маркетплейсов и рекламы.',
          'Мы можем изменять, расширять, ограничивать или обновлять отдельные функции сервиса без сохранения полной идентичности всех предыдущих сценариев, если это требуется для развития продукта, безопасности или стабильности.',
        ],
      },
      {
        title: '3. Аккаунт и доступ',
        paragraphs: [
          'Для части функций требуется зарегистрированный аккаунт с актуальным email-адресом.',
          'Вы отвечаете за сохранность данных для входа и за действия, совершённые через ваш аккаунт.',
          'Мы можем ограничить или приостановить доступ к аккаунту при злоупотреблении сервисом, попытках обхода лимитов, нарушении закона, нарушении этих условий или создании риска для инфраструктуры и других пользователей.',
        ],
      },
      {
        title: '4. Права на контент',
        paragraphs: [
          'Вы сохраняете права на исходные изображения, которые загружаете в сервис.',
          'Загружая материалы, вы подтверждаете, что имеете право использовать их, обрабатывать и при необходимости публиковать.',
          'Результаты, полученные с помощью сервиса, можно использовать в коммерческих и маркетинговых целях в рамках применимого законодательства и прав на исходные материалы.',
          'Вы самостоятельно отвечаете за финальную проверку результата перед публикацией, включая корректность товара, описаний, визуальных утверждений, брендовых элементов и соблюдение прав третьих лиц.',
        ],
      },
      {
        title: '5. Запрещённый контент',
        paragraphs: ['Запрещается загружать или обрабатывать материалы, которые:'],
        list: [
          'нарушают права третьих лиц',
          'содержат незаконный, оскорбительный или вводящий в заблуждение контент',
          'используются для мошенничества',
          'содержат персональные данные без необходимого согласия',
          'могут нарушать правила платформ, маркетплейсов или рекламных систем, если у вас нет права на такое использование',
        ],
      },
      {
        title: '6. Тарифы и оплата',
        paragraphs: [
          'Сервис может включать бесплатные и платные тарифы с лимитами по объёму использования.',
          'Стоимость, лимиты и доступные платёжные способы публикуются на сайте и в личном кабинете. Перед оплатой всегда ориентируйтесь на актуальную информацию в интерфейсе продукта.',
          'Факт оплаты не означает бессрочное сохранение любой конкретной функции в неизменном виде. Мы вправе обновлять тарифные лимиты, состав функций и правила использования на будущее время.',
          'Если для определённой оплаты, возврата или отмены применяются обязательные нормы закона, они сохраняют силу независимо от формулировок этих условий.',
        ],
      },
      {
        title: '7. Результаты ИИ и пользовательская проверка',
        paragraphs: [
          'Результаты генерации, улучшения и редактирования создаются автоматически с использованием ИИ и зависят от исходных материалов, выбранного сценария, внешних AI-провайдеров и технических ограничений.',
          'Мы не гарантируем, что каждый результат будет идеально соответствовать вашим ожиданиям, задачам бренда, требованиям платформ, внутренним правилам компании или коммерческим целям.',
          'Перед публикацией, запуском рекламы, размещением на маркетплейсе или использованием в коммуникациях вы должны самостоятельно проверить финальный результат.',
        ],
      },
      {
        title: '8. Ограничение ответственности',
        paragraphs: [
          'Сервис предоставляется по модели «как есть» и «по мере доступности». Мы не даём гарантий бесперебойной работы, постоянной доступности всех функций, отсутствия ошибок или полного соответствия результата любой конкретной бизнес-задаче.',
          'В максимально допустимой законом степени мы не отвечаем за косвенные убытки, упущенную выгоду, потерю данных, потерю клиентов, репутационные потери или последствия использования либо невозможности использования сервиса.',
          'Если применимое право всё же допускает предъявление требований к нам, совокупная ответственность по платным услугам ограничивается суммой, фактически уплаченной вами за сервис за 30 календарных дней, предшествующих событию, которое стало основанием для требования.',
        ],
      },
      {
        title: '9. Данные и хранение',
        paragraphs: [
          'Мы принимаем разумные технические меры для защиты пользовательских данных и загруженных файлов, но не можем гарантировать абсолютную неуязвимость любой цифровой инфраструктуры.',
          'Срок хранения файлов, результатов обработки и связанных данных может зависеть от настроек продукта, тарифа, технических ограничений и внутренних правил эксплуатации сервиса.',
          'Пользователю рекомендуется самостоятельно сохранять важные результаты и не рассчитывать на бессрочное хранение любого загруженного или сгенерированного контента внутри сервиса.',
        ],
      },
      {
        title: '10. Изменение условий',
        paragraphs: [
          'Мы можем обновлять эти условия по мере развития продукта, платёжной инфраструктуры, состава функций и требований законодательства.',
          'Новая редакция условий начинает применяться с момента публикации на сайте, если прямо не указано иное.',
          'Продолжение использования сервиса после обновления условий означает согласие с новой редакцией.',
        ],
      },
      {
        title: '11. Контакты',
        paragraphs: ['По вопросам поддержки и использования сервиса свяжитесь с нами:'],
      },
    ],
    location: 'Астана, Казахстан',
  },
  en: {
    metaTitle: 'Terms of Use | Luminify',
    metaDescription: 'Terms of use for the Luminify service covering AI generation, image enhancement, and related workflows.',
    back: 'Back',
    title: 'Terms of Use',
    eyebrow: 'Service rules',
    intro:
      'This page explains the main rules for using Luminify. We wrote it in clear, practical language so it is easy to understand how the service works, what should be reviewed before publishing, and where our responsibility is reasonably limited.',
    updatedAt: 'Last updated: April 7, 2026',
    homeHref: '/',
    faqHref: '/faq',
    contactHref: '/contacts',
    primaryCta: 'Contact support',
    secondaryCta: 'Open FAQ',
    summaryTitle: 'The short version',
    summaryBody:
      'Luminify helps create visuals for catalogs, ads, and marketplaces, but the final review before publication remains the user’s responsibility.',
    highlightsTitle: 'What matters most',
    highlights: [
      'You keep the rights to the source images you upload.',
      'AI outputs should be reviewed before publishing or running ads.',
      'We may update service features and plan limits as the product evolves.',
      'Mandatory user rights under applicable law remain in force.',
    ],
    guideTitle: 'How to read this page',
    guideBody:
      'Start with the general terms and content rights, then review the sections on payments, AI outputs, and limitation of liability. That gives you the clearest business-level view of how the service works.',
    guideNote:
      'If you need a practical answer about the terms, billing, or account access, the fastest option is to email us.',
    contactTitle: 'Need help with the terms or billing?',
    contactBody:
      'If you have a question about using the service, billing, limits, or account access, send us a message and we will help you sort it out clearly.',
    sections: [
      {
        title: '1. General Terms',
        paragraphs: [
          'These Terms of Use govern access to and use of the Luminify service.',
          'By using the service, you agree to these terms. If you do not agree, please do not use the service.',
          'If any user rights are protected by mandatory applicable law, those rights prevail over these terms to the extent required by law.',
        ],
      },
      {
        title: '2. Service Description',
        paragraphs: [
          'Luminify is an online service for creating, enhancing, and preparing commercial visuals with AI.',
          'The service is designed for stores, brands, and teams that need fast visual content for catalogs, marketplaces, and ads.',
          'We may change, expand, limit, or update features without preserving every previous workflow in identical form when needed for product development, security, or platform stability.',
        ],
      },
      {
        title: '3. Account and Access',
        paragraphs: [
          'Some features require a registered account with a valid email address.',
          'You are responsible for keeping your login credentials secure and for activities carried out through your account.',
          'We may limit or suspend access to an account in cases of abuse, attempts to bypass usage limits, legal violations, breaches of these terms, or conduct that creates risk for the service, infrastructure, or other users.',
        ],
      },
      {
        title: '4. Content Rights',
        paragraphs: [
          'You retain rights to the source images you upload to the service.',
          'By uploading content, you confirm that you have the right to use, process, and, where relevant, publish that content.',
          'Outputs created with the service may be used for commercial and marketing purposes, subject to applicable law and your rights to the source materials.',
          'You are responsible for reviewing final outputs before publication, including product accuracy, descriptive claims, branding elements, and third-party rights clearance.',
        ],
      },
      {
        title: '5. Prohibited Content',
        paragraphs: ['You may not upload or process content that:'],
        list: [
          'infringes third-party rights',
          'contains unlawful, abusive, or misleading content',
          'is used for fraud or deception',
          'includes personal data without the required consent',
          'may violate marketplace, platform, or advertising rules where you do not have the right to use such content',
        ],
      },
      {
        title: '6. Plans and Payments',
        paragraphs: [
          'The service may include free and paid plans with usage limits.',
          'Pricing, limits, and available payment methods are shown on the site and inside the account area. Always rely on the current product interface before making a purchase.',
          'Payment does not guarantee that every specific feature will remain permanently available in unchanged form. We may update plan limits, feature scope, and usage rules for future periods.',
          'If mandatory law grants specific refund, cancellation, or consumer rights, those rights remain in effect regardless of these terms.',
        ],
      },
      {
        title: '7. AI Outputs and User Review',
        paragraphs: [
          'Generation, enhancement, and editing outputs are created automatically using AI and depend on source materials, selected workflows, external AI providers, and technical limitations.',
          'We do not guarantee that every output will match your expectations, brand requirements, platform rules, internal company standards, or commercial goals.',
          'Before publishing, advertising, listing on a marketplace, or otherwise using any output, you must review and approve it yourself.',
        ],
      },
      {
        title: '8. Limitation of Liability',
        paragraphs: [
          'The service is provided on an “as is” and “as available” basis. We do not warrant uninterrupted access, error-free operation, or that every feature will remain continuously available.',
          'To the maximum extent permitted by law, we are not liable for indirect damages, lost profits, loss of data, loss of customers, reputational harm, or consequences arising from use of or inability to use the service.',
          'Where applicable law still allows claims against us, aggregate liability for paid services is limited to the amount you actually paid for the service in the 30 calendar days preceding the event giving rise to the claim.',
        ],
      },
      {
        title: '9. Data and Storage',
        paragraphs: [
          'We take reasonable technical steps to protect user data and uploaded files, but we cannot guarantee absolute security for any digital infrastructure.',
          'File retention, outputs, and related data may depend on product settings, plan limits, technical constraints, and internal operational rules.',
          'Users should keep their own copies of important outputs and should not rely on indefinite storage of uploaded or generated content within the service.',
        ],
      },
      {
        title: '10. Changes to These Terms',
        paragraphs: [
          'We may update these terms as the product, payment infrastructure, feature set, and legal requirements evolve.',
          'A new version becomes effective upon publication on the site unless stated otherwise.',
          'Continuing to use the service after changes take effect means you accept the updated version.',
        ],
      },
      {
        title: '11. Contact',
        paragraphs: ['For support and service-related questions, contact us at:'],
      },
    ],
    location: 'Astana, Kazakhstan',
  },
}

async function getCurrentLocale(): Promise<'ru' | 'en'> {
  const cookieStore = await cookies()
  return cookieStore.get('NEXT_LOCALE')?.value === 'ru' ? 'ru' : 'en'
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCurrentLocale()
  const copy = TERMS_COPY[locale]

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: `${APP_URL}/terms`,
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: `${APP_URL}/terms`,
      type: 'website',
    },
  }
}

export default async function TermsPage() {
  const locale = await getCurrentLocale()
  const copy = TERMS_COPY[locale]

  const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: copy.metaTitle,
    description: copy.metaDescription,
    url: `${APP_URL}/terms`,
    about: {
      '@type': 'Thing',
      name: copy.title,
    },
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Script
        id="terms-page-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }}
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
                <FileText className="h-3.5 w-3.5" />
                {copy.eyebrow}
              </span>
              <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4.8vw,3.6rem)] font-medium leading-tight tracking-tight text-foreground">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {copy.intro}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={copy.contactHref}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-rose-gold-600 hover:shadow-glow"
                >
                  {copy.primaryCta}
                </Link>
                <Link
                  href={copy.faqHref}
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
                    <CircleHelp className="h-5 w-5 text-rose-gold-600" />
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
