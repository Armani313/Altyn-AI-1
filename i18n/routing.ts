import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // Supported locales
  locales: ['ru', 'en'] as const,

  // English is default — shown without /en/ prefix
  // Russian is shown with /ru/ prefix
  defaultLocale: 'en',

  // 'as-needed' = default locale has no prefix (/login, /dashboard)
  // non-default locales have prefix (/en/login, /en/dashboard)
  localePrefix: 'as-needed',

  // Persist locale choice in a cookie so that manual language switching
  // survives page reloads and new sessions (takes precedence over
  // Accept-Language on subsequent visits).
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
})

export type Locale = (typeof routing.locales)[number]
