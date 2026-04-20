import type { Metadata } from 'next'

export type SeoLocale = 'ru' | 'en'

type SeoKeywordKey =
  | 'landing'
  | 'about'
  | 'contacts'
  | 'faq'
  | 'tools'
  | 'background-remover'
  | 'white-background'
  | 'blur-background'
  | 'change-background-color'
  | 'add-background'
  | 'photo-enhancer'
  | 'category-apparel'
  | 'category-cosmetics'
  | 'category-jewelry'
  | 'category-outerwear'
  | 'category-headwear'
  | 'category-scarves'
  | 'category-bottomwear'
  | 'category-watches'
  | 'category-bags'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://luminify.app'

const PAGE_KEYWORDS: Record<SeoKeywordKey, Record<SeoLocale, string[]>> = {
  landing: {
    ru: [
      'ии фото товара',
      'ии фото одежды',
      'ai фото косметики',
      'ии фото украшений',
      'лайфстайл фото на модели',
      'ghost mannequin ai',
      'фото для shopify',
      'контент для amazon',
      'генерация фото товаров',
      'dtc бренд контент',
      'luminify',
    ],
    en: [
      'ai product photography',
      'ai clothing photography',
      'ai apparel photos',
      'ai cosmetics photography',
      'ai jewelry photography',
      'on-model lifestyle photos',
      'ghost mannequin ai',
      'shopify product photos ai',
      'amazon product photography ai',
      'etsy product photos',
      'dtc product photo ai',
      'ai product photo generator',
      'tiktok shop product photos',
      'ai lifestyle photo generator',
      'virtual model photography',
      'ecommerce product photo ai',
      'Luminify',
    ],
  },
  about: {
    ru: [
      'о luminify',
      'luminify о компании',
      'кто создал luminify',
      'ai сервис для фото товаров',
      'ювелирный контент с ии',
    ],
    en: [
      'about luminify',
      'who built luminify',
      'ai product photo company',
      'jewelry content platform',
      'luminify founder',
    ],
  },
  contacts: {
    ru: [
      'контакты luminify',
      'связаться с luminify',
      'поддержка luminify',
      'вопросы по тарифам luminify',
      'контакты сервиса ai фото товаров',
    ],
    en: [
      'luminify contact',
      'contact luminify',
      'luminify support',
      'ai product photo support',
      'luminify pricing contact',
    ],
  },
  faq: {
    ru: [
      'faq luminify',
      'вопросы и ответы luminify',
      'как работает luminify',
      'faq ai фото товара',
      'часто задаваемые вопросы luminify',
    ],
    en: [
      'luminify faq',
      'frequently asked questions luminify',
      'how luminify works',
      'ai product photo faq',
      'luminify help',
    ],
  },
  tools: {
    ru: [
      'инструменты для фото товаров',
      'обработка фото товаров онлайн',
      'ai инструменты для фото',
      'улучшение фото товара',
      'удаление фона онлайн',
      'создание карточек товара',
      'luminify tools',
    ],
    en: [
      'ai photo tools',
      'product photo tools',
      'photo editing tools online',
      'background remover online',
      'product card maker',
      'photo enhancer online',
      'Luminify tools',
    ],
  },
  'background-remover': {
    ru: [
      'удалить фон с фото',
      'удаление фона онлайн',
      'удалить фон с фото товара',
      'прозрачный фон png',
      'background remover',
      'remove background online',
    ],
    en: [
      'background remover',
      'remove background online',
      'remove background from product photo',
      'transparent png maker',
      'ai background remover',
      'product photo background remover',
    ],
  },
  'white-background': {
    ru: [
      'сделать белый фон на фото',
      'белый фон для маркетплейса',
      'заменить фон на белый',
      'white background tool',
      'фото товара на белом фоне',
    ],
    en: [
      'white background tool',
      'make background white',
      'white background for marketplace',
      'product photo white background',
      'replace background with white',
    ],
  },
  'blur-background': {
    ru: [
      'размыть фон на фото',
      'blur background online',
      'размыть фон на фото товара',
      'эффект боке онлайн',
      'размытие фона для карточки товара',
    ],
    en: [
      'blur background online',
      'photo background blur',
      'product photo blur background',
      'bokeh effect online',
      'blur image background',
    ],
  },
  'change-background-color': {
    ru: [
      'изменить цвет фона',
      'заменить цвет фона онлайн',
      'однотонный фон для фото товара',
      'цвет фона для маркетплейса',
      'gradient background tool',
    ],
    en: [
      'change background color',
      'replace background color online',
      'solid background for product photo',
      'gradient background tool',
      'product photo background color',
    ],
  },
  'add-background': {
    ru: [
      'добавить фон на фото',
      'заменить фон на фото',
      'добавить свой фон',
      'изменить фон фото товара',
      'photo background changer',
    ],
    en: [
      'add background to photo',
      'photo background changer',
      'replace photo background',
      'custom background uploader',
      'product photo background replacement',
    ],
  },
  'photo-enhancer': {
    ru: [
      'улучшить фото',
      'улучшить фото товара',
      'увеличить фото без потери качества',
      'повысить качество фото',
      'улучшение фото онлайн',
      'улучшить фото для маркетплейса',
      'ai upscale',
    ],
    en: [
      'photo enhancer',
      'image upscaler',
      'enhance product photo',
      'increase image resolution',
      'upscale image online',
      'improve image quality',
      'ai photo enhancement',
    ],
  },
  'category-apparel': {
    ru: [
      'ai фото одежды',
      'ии фото одежды на модели',
      'фото на манекене на модели ai',
      'ghost mannequin ai',
      'on-model фото одежды',
      'ai фото для shopify одежда',
      'ai фото одежды для amazon',
      'ai фото одежды для tiktok shop',
      'фото для лукбука ai',
      'нейрофото одежды на модели',
    ],
    en: [
      'ai clothing photography',
      'ai apparel photos',
      'ghost mannequin to on-model',
      'ai on-model fashion photos',
      'ai fashion photography',
      'shopify clothing photos ai',
      'amazon clothing photo ai',
      'tiktok shop clothing photos',
      'lookbook photos ai',
      'ai photoshoot for clothing brand',
      'virtual model photography apparel',
    ],
  },
  'category-cosmetics': {
    ru: [
      'ai фото косметики',
      'ии фото косметики',
      'фото для бьюти-бренда ai',
      'фото скинкера ai',
      'фото макияжа ai',
      'фото хейркера ai',
      'ai фото для shopify бьюти',
      'ai фото оттенков косметики',
      'фото для маркетплейса косметика ai',
    ],
    en: [
      'ai cosmetics photography',
      'ai beauty product photos',
      'ai skincare photography',
      'ai makeup photography',
      'ai haircare photography',
      'shopify beauty photos ai',
      'beauty brand photo ai',
      'shade variant product photo ai',
      'indie beauty photography ai',
      'pdp beauty photos ai',
    ],
  },
  'category-jewelry': {
    ru: [
      'ai фото украшений',
      'ии фото украшений',
      'on-model фото колец',
      'on-model серьги',
      'ai фото цепочек на модели',
      'фото украшений для лукбука ai',
      'fine jewelry фото ai',
      'demi-fine jewelry photos ai',
      'фото украшений для etsy ai',
    ],
    en: [
      'ai jewelry photography',
      'on-model jewelry photography',
      'ai ring photography',
      'ai earring photography',
      'ai necklace photography',
      'fine jewelry photos ai',
      'demi-fine jewelry photo ai',
      'fashion jewelry photo ai',
      'etsy jewelry photos ai',
      'jewelry lookbook ai',
    ],
  },
  'category-outerwear': {
    ru: [
      'ai фото верхней одежды',
      'ai фото куртки на модели',
      'ai фото пальто на модели',
      'ai фото блузы на модели',
      'ghost mannequin to on-model',
      'on-model фото одежды',
      'ии фото куртки',
      'фото пуховика на модели ai',
      'ai лукбук верхней одежды',
      'ai фото для shopify одежда',
      'ai фото для amazon apparel',
      'ai фото для tiktok shop одежда',
      'luminify outerwear',
    ],
    en: [
      'ai outerwear photography',
      'ai jacket photo on model',
      'ai coat photo on model',
      'ai blouse photo ai',
      'ghost mannequin to on-model',
      'on-model apparel photography',
      'puffer jacket on model ai',
      'trench coat on model ai',
      'outerwear lookbook ai',
      'ai photo for shopify outerwear',
      'ai photo for amazon apparel',
      'ai photo for tiktok shop apparel',
      'luminify outerwear',
    ],
  },
  'category-headwear': {
    ru: [
      'ai фото очков на модели',
      'ai фото солнцезащитных очков',
      'ai фото шляпы на модели',
      'ai фото кепки',
      'ai фото бини',
      'ai фото берета',
      'ai фото ободка',
      'ai фото заколки',
      'ai фото аксессуаров для волос',
      'ai eyewear photo',
      'on-model фото очков',
      'фото головных уборов ai',
      'ai фото для shopify аксессуары',
      'ai фото для amazon eyewear',
      'ai фото для etsy аксессуары',
      'luminify headwear',
    ],
    en: [
      'ai sunglasses photography',
      'ai eyewear photography',
      'ai eyeglasses on model',
      'ai hat photography',
      'ai beanie photo ai',
      'ai baseball cap photo',
      'ai beret on model',
      'ai headband photo',
      'ai hair clip photography',
      'ai hair accessories photo',
      'on-model eyewear photo',
      'headwear lookbook ai',
      'ai photo for shopify accessories',
      'ai photo for amazon eyewear',
      'ai photo for etsy accessories',
      'luminify headwear',
    ],
  },
  'category-scarves': {
    ru: [
      'ai фото платка на модели',
      'ai фото шали',
      'ai фото палантина',
      'on-model фото платка',
      'фото платка для лукбука ai',
      'ai фото шёлкового платка',
      'ai фото шарфа',
      'ai фото драпировки ткани',
      'фото хиджаба на модели ai',
      'ai фото для etsy платки',
      'ai фото для shopify аксессуары',
      'luminify scarves',
    ],
    en: [
      'ai scarf on model photography',
      'ai silk scarf photo',
      'ai shawl photography',
      'ai wrap photography',
      'on-model scarf photography',
      'scarf lookbook ai',
      'ai hijab photography',
      'ai fabric drape photography',
      'ai photo for etsy scarves',
      'ai photo for shopify accessories',
      'luxury scarf photo ai',
      'luminify scarves',
    ],
  },
  'category-bottomwear': {
    ru: [
      'ai фото юбки на модели',
      'ai фото брюк на модели',
      'ai фото джинс на модели',
      'ai фото шорт на модели',
      'ai фото легинсов на модели',
      'ghost mannequin юбка ai',
      'on-model фото брюк',
      'фото штанов на модели ai',
      'ai лукбук нижней одежды',
      'ai фото для shopify джинсы',
      'ai фото для amazon apparel',
      'ai фото для tiktok shop одежда',
      'luminify bottomwear',
    ],
    en: [
      'ai skirt photography on model',
      'ai pants photo on model',
      'ai jeans photography on model',
      'ai shorts photo on model',
      'ai leggings photography',
      'ghost mannequin skirt ai',
      'on-model bottoms photography',
      'ai denim photography',
      'bottomwear lookbook ai',
      'ai photo for shopify denim',
      'ai photo for amazon apparel',
      'ai photo for tiktok shop apparel',
      'luminify bottomwear',
    ],
  },
  'category-watches': {
    ru: [
      'ai фото часов на модели',
      'ai фото часов на запястье',
      'лайфстайл фото часов',
      'ai фото наручных часов',
      'ai фото smart watch',
      'ai фото умных часов',
      'watch on wrist ai',
      'фото часов для маркетплейса ai',
      'ai фото для shopify часы',
      'ai фото для amazon watches',
      'фото швейцарских часов ai',
      'luminify watches',
    ],
    en: [
      'ai watch photography on wrist',
      'ai wristwatch photo',
      'watch on wrist ai',
      'ai smartwatch photography',
      'ai luxury watch photo',
      'watch lifestyle photography ai',
      'ai watch photography for shopify',
      'ai watch photo for amazon',
      'swiss watch photography ai',
      'ai photo for watch brand',
      'watch ad creative ai',
      'luminify watches',
    ],
  },
  'category-bags': {
    ru: [
      'ai фото сумки на модели',
      'ai фото клатча',
      'ai фото рюкзака на модели',
      'ai фото кроссбоди',
      'ai фото кожаной сумки',
      'on-model фото сумки',
      'bag on model ai',
      'ai фото тоут сумки',
      'лайфстайл фото клатча ai',
      'ai фото для shopify сумки',
      'ai фото для amazon handbags',
      'ai фото для etsy сумки',
      'luminify bags',
    ],
    en: [
      'ai bag photography on model',
      'ai handbag photo on model',
      'ai clutch photography',
      'ai backpack photo on model',
      'ai crossbody bag photography',
      'on-model handbag photography',
      'ai tote bag photography',
      'bag lifestyle photography ai',
      'ai photo for shopify handbags',
      'ai photo for amazon bags',
      'ai photo for etsy bags',
      'luxury bag photography ai',
      'luminify bags',
    ],
  },
}

function uniqueKeywords(keywords: string[]) {
  return Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)))
}

export function mergeSeoKeywords(...groups: Array<string[] | undefined>) {
  return uniqueKeywords(groups.flatMap((group) => group ?? []))
}

export function getSeoKeywords(key: SeoKeywordKey, locale: SeoLocale) {
  return PAGE_KEYWORDS[key][locale]
}

export function getLocalizedPath(locale: SeoLocale, path: string) {
  if (path === '/') {
    return locale === 'ru' ? '/ru' : ''
  }

  return locale === 'ru' ? `/ru${path}` : path
}

export function getPublicUrl(locale: SeoLocale, path: string) {
  return `${APP_URL}${getLocalizedPath(locale, path)}`
}

export function getLanguageAlternates(path: string) {
  return {
    en: getPublicUrl('en', path),
    ru: getPublicUrl('ru', path),
    'x-default': getPublicUrl('en', path),
  }
}

export function buildLocalizedMetadata(args: {
  locale: SeoLocale
  path: string
  title: string
  description: string
  keywords?: string[]
}): Metadata {
  const { locale, path, title, description, keywords } = args
  const url = getPublicUrl(locale, path)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: getLanguageAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Luminify',
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      alternateLocale: locale === 'ru' ? 'en_US' : 'ru_RU',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  }
}
