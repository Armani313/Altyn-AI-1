import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { VALID_PRODUCT_TYPES, type ProductType } from '@/lib/constants'
import { CategoryWorkspace } from '@/components/generate/category-workspace'

type SeoLocale = 'ru' | 'en'

const CATEGORY_TITLES: Record<SeoLocale, Record<ProductType, string>> = {
  ru: {
    jewelry: 'Украшения — ИИ лайфстайл фото на модели | Luminify',
    scarves: 'Платки и шали — ИИ лайфстайл фото на модели | Luminify',
    headwear: 'Головные уборы и аксессуары — ИИ лайфстайл фото | Luminify',
    outerwear: 'Верхняя одежда — ИИ фото на модели | Luminify',
    bottomwear: 'Юбки, брюки, шорты — ИИ фото на модели | Luminify',
    watches: 'Часы — ИИ лайфстайл фото | Luminify',
    bags: 'Сумки и клатчи — ИИ лайфстайл фото | Luminify',
  },
  en: {
    jewelry: 'Jewelry — AI On-Model Lifestyle Photos | Luminify',
    scarves: 'Scarves & Wraps — AI On-Model Lifestyle Photos | Luminify',
    headwear: 'Headwear & Accessories — AI Lifestyle Photos | Luminify',
    outerwear: 'Outerwear — AI On-Model Photos | Luminify',
    bottomwear: 'Skirts, Pants, Shorts — AI On-Model Photos | Luminify',
    watches: 'Watches — AI Lifestyle Photos | Luminify',
    bags: 'Bags & Clutches — AI Lifestyle Photos | Luminify',
  },
}

const CATEGORY_DESCRIPTIONS: Record<SeoLocale, Record<ProductType, string>> = {
  ru: {
    jewelry:
      'Загрузите фото украшения — получите профессиональные on-model кадры колец, серёг, колье и браслетов за 30 секунд. Готово для Shopify, Amazon, TikTok Shop и Etsy.',
    scarves:
      'Платки, шали и палантины на модели — AI задрапирует ткань и создаст лайфстайл-кадры для лукбука, маркетплейсов и социальных сетей.',
    headwear:
      'Очки, шляпы и аксессуары для волос на модели — студийное качество без фотосессии. Подходит для PDP, рекламы и Instagram.',
    outerwear:
      'Куртки, пальто, блузы и топы на виртуальной модели — превратите плоский снимок в коммерческие on-model кадры за минуту.',
    bottomwear:
      'Юбки, брюки, шорты — AI примерит вашу модель и создаст лайфстайл-фото для Shopify, Amazon, TikTok Shop.',
    watches:
      'Часы и браслеты на модели — элегантные лайфстайл-снимки для e-commerce и рекламы без аренды студии.',
    bags:
      'Сумки, клатчи, рюкзаки на модели — AI создаст лайфстайл-фото с нужным ракурсом и освещением для PDP и соцсетей.',
  },
  en: {
    jewelry:
      'Upload a product photo — get professional on-model shots of rings, earrings, necklaces and bracelets in 30 seconds. Ready for Shopify, Amazon, TikTok Shop and Etsy.',
    scarves:
      'Scarves, shawls and wraps on a model — AI drapes the fabric and delivers lookbook-grade lifestyle shots for marketplaces and social.',
    headwear:
      'Sunglasses, hats and hair accessories on a model — studio quality without a photoshoot. Perfect for PDPs, ads and Instagram.',
    outerwear:
      'Jackets, coats, blouses and tops on a virtual model — turn a flat-lay into commercial on-model shots in under a minute.',
    bottomwear:
      'Skirts, pants, shorts — AI fits them on your model and creates lifestyle photos for Shopify, Amazon and TikTok Shop.',
    watches:
      'Watches and wrist bracelets on a model — elegant lifestyle shots for e-commerce and ads, no studio rental required.',
    bags:
      'Bags, clutches, backpacks on a model — AI creates lifestyle photos with the right angle and lighting for PDPs and social.',
  },
}

const CATEGORY_KEYWORDS: Record<SeoLocale, Record<ProductType, string[]>> = {
  ru: {
    jewelry: [
      'ai фото украшений',
      'on-model фото колец',
      'on-model серьги',
      'ии фото цепочек на модели',
      'fine jewelry фото ai',
      'фото украшений для etsy',
      'luminify jewelry',
    ],
    scarves: [
      'ai фото платка на модели',
      'фото шали на модели',
      'лайфстайл фото палантина',
      'scarf on model ai',
      'luminify scarves',
    ],
    headwear: [
      'ai фото очков на модели',
      'ai фото шляпы',
      'ai фото аксессуаров для волос',
      'luminify headwear',
    ],
    outerwear: [
      'ai фото одежды на модели',
      'ghost mannequin ai',
      'куртка на модели ai',
      'фото блузы на модели ai',
      'luminify outerwear',
    ],
    bottomwear: [
      'ai фото юбки на модели',
      'ai фото брюк',
      'ai фото шорт на модели',
      'luminify bottomwear',
    ],
    watches: [
      'ai фото часов на модели',
      'лайфстайл фото часов',
      'watch on wrist ai',
      'luminify watches',
    ],
    bags: [
      'ai фото сумки на модели',
      'лайфстайл фото клатча',
      'bag on model ai',
      'luminify bags',
    ],
  },
  en: {
    jewelry: [
      'ai jewelry photography',
      'on-model jewelry photography',
      'ai ring photography',
      'ai earring photography',
      'ai necklace photography',
      'fine jewelry photos ai',
      'luminify jewelry',
    ],
    scarves: [
      'ai scarf on model',
      'ai shawl photography',
      'scarf lookbook ai',
      'luminify scarves',
    ],
    headwear: [
      'ai sunglasses on model',
      'ai hat photography',
      'ai hair accessories photo',
      'luminify headwear',
    ],
    outerwear: [
      'ai clothing on model',
      'ghost mannequin to on-model',
      'ai jacket photo',
      'ai blouse photo',
      'luminify outerwear',
    ],
    bottomwear: [
      'ai skirt on model',
      'ai pants photography',
      'ai shorts photography',
      'luminify bottomwear',
    ],
    watches: [
      'ai watch on wrist',
      'ai watch photography',
      'watch lifestyle ai',
      'luminify watches',
    ],
    bags: [
      'ai bag on model',
      'ai clutch photography',
      'bag lifestyle ai',
      'luminify bags',
    ],
  },
}

export function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }) {
  // Next.js 16 — params is a Promise but generateMetadata receives resolved value in practice
  // We handle both cases for safety
  return Promise.resolve(params).then(({ locale, category }) => {
    if (!VALID_PRODUCT_TYPES.has(category as ProductType)) {
      return { title: '404' }
    }
    const currentLocale: SeoLocale = locale === 'ru' ? 'ru' : 'en'
    const productType = category as ProductType
    return {
      title: CATEGORY_TITLES[currentLocale][productType],
      description: CATEGORY_DESCRIPTIONS[currentLocale][productType],
      keywords: CATEGORY_KEYWORDS[currentLocale][productType],
      robots: { index: false, follow: false },
    }
  })
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale, category } = await params

  if (!VALID_PRODUCT_TYPES.has(category as ProductType)) {
    notFound()
  }

  setRequestLocale(locale)

  return <CategoryWorkspace productType={category as ProductType} />
}
