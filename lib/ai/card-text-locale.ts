const DEFAULT_CARD_TEXT_LOCALE = 'en'

const LANGUAGE_NAME_OVERRIDES: Record<string, { englishName: string; nativeName: string }> = {
  ar: { englishName: 'Arabic', nativeName: 'العربية' },
  de: { englishName: 'German', nativeName: 'Deutsch' },
  en: { englishName: 'English', nativeName: 'English' },
  es: { englishName: 'Spanish', nativeName: 'Español' },
  fr: { englishName: 'French', nativeName: 'Français' },
  it: { englishName: 'Italian', nativeName: 'Italiano' },
  ja: { englishName: 'Japanese', nativeName: '日本語' },
  kk: { englishName: 'Kazakh', nativeName: 'Қазақ тілі' },
  ko: { englishName: 'Korean', nativeName: '한국어' },
  pl: { englishName: 'Polish', nativeName: 'Polski' },
  pt: { englishName: 'Portuguese', nativeName: 'Português' },
  ru: { englishName: 'Russian', nativeName: 'Русский' },
  tr: { englishName: 'Turkish', nativeName: 'Türkçe' },
  uk: { englishName: 'Ukrainian', nativeName: 'Українська' },
  zh: { englishName: 'Chinese', nativeName: '中文' },
}

export interface CardTextLocaleConfig {
  normalizedLocale: string
  languageCode: string
  englishName: string
  nativeName: string
}

function normalizeWhitespace(value?: string | null): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function getLanguageCode(locale: string): string {
  try {
    return new Intl.Locale(locale).language
  } catch {
    return locale.split('-')[0]?.toLowerCase() || DEFAULT_CARD_TEXT_LOCALE
  }
}

export function normalizeCardTextLocale(locale?: string | null): string {
  const raw = normalizeWhitespace(locale)
  if (!raw) return DEFAULT_CARD_TEXT_LOCALE

  const candidate = raw.replace(/_/g, '-')

  try {
    return new Intl.Locale(candidate).toString()
  } catch {
    const fallbackLanguage = candidate.split('-')[0]?.toLowerCase() || DEFAULT_CARD_TEXT_LOCALE
    return /^[a-z]{2,3}$/.test(fallbackLanguage) ? fallbackLanguage : DEFAULT_CARD_TEXT_LOCALE
  }
}

export function getCardTextLocaleConfig(locale?: string | null): CardTextLocaleConfig {
  const normalizedLocale = normalizeCardTextLocale(locale)
  const languageCode = getLanguageCode(normalizedLocale)
  const override = LANGUAGE_NAME_OVERRIDES[languageCode]

  if (override) {
    return {
      normalizedLocale,
      languageCode,
      englishName: override.englishName,
      nativeName: override.nativeName,
    }
  }

  let englishName = languageCode.toUpperCase()
  let nativeName = englishName

  if (typeof Intl.DisplayNames === 'function') {
    try {
      englishName =
        new Intl.DisplayNames(['en'], { type: 'language' }).of(languageCode) ?? englishName
    } catch {
      // Keep the fallback label when Intl.DisplayNames cannot resolve the language.
    }

    try {
      nativeName =
        new Intl.DisplayNames([normalizedLocale], { type: 'language' }).of(languageCode) ?? englishName
    } catch {
      nativeName = englishName
    }
  }

  return {
    normalizedLocale,
    languageCode,
    englishName,
    nativeName,
  }
}

export function buildCardTextLocalizationDirective(locale?: string | null): string {
  const { normalizedLocale, englishName, nativeName } = getCardTextLocaleConfig(locale)
  const languageLabel = nativeName === englishName ? englishName : `${englishName} (${nativeName})`

  return [
    `VISIBLE TEXT LANGUAGE: Every headline, bullet point, badge, CTA, label, and caption inside the generated card image must be written in ${languageLabel}. Locale tag: ${normalizedLocale}.`,
    `Do not mix ${englishName} with other languages inside the same card unless a fixed logo mark is already part of the reference artwork.`,
    `If the seller-provided copy is written in another language, translate and adapt it into concise natural ${englishName}.`,
    'Preserve brand names, trademarked names, model names, SKU codes, and other proper nouns exactly as provided.',
    'Auto-scale typography to fit the available text zones: shrink font size, rebalance line breaks, shorten bullets, or compress wording when translation becomes longer.',
    'Never let text overflow, clip, collide with the product, or leave the safe layout area.',
  ].join('\n')
}

export function buildCardProductInfoBlock(
  productName?: string,
  brandName?: string,
  productDescription?: string,
): { hasText: boolean; block: string } {
  const name = normalizeWhitespace(productName)
  const brand = normalizeWhitespace(brandName)
  const description = normalizeWhitespace(productDescription)

  const lines = [
    brand ? `Brand: "${brand}"` : '',
    name ? `Product name: "${name}"` : '',
    description ? `Key selling points: ${description}` : '',
  ].filter(Boolean)

  return {
    hasText: lines.length > 0,
    block: lines.map((line) => `  • ${line}`).join('\n'),
  }
}
