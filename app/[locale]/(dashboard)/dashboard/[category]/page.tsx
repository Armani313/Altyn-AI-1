import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { VALID_PRODUCT_TYPES, type ProductType } from '@/lib/constants'
import { CategoryWorkspace } from '@/components/generate/category-workspace'

const CATEGORY_TITLES: Record<ProductType, string> = {
  jewelry:    'Украшения — Лайфстайл фото',
  scarves:    'Платки — Лайфстайл фото',
  headwear:   'Головные уборы — Лайфстайл фото',
  outerwear:  'Верхняя одежда — Лайфстайл фото',
  bottomwear: 'Нижняя одежда — Лайфстайл фото',
  watches:    'Часы — Лайфстайл фото',
  bags:       'Сумки — Лайфстайл фото',
}

export function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  // Next.js 16 — params is a Promise but generateMetadata receives resolved value in practice
  // We handle both cases for safety
  return Promise.resolve(params).then(({ category }) => {
    if (!VALID_PRODUCT_TYPES.has(category as ProductType)) {
      return { title: '404' }
    }
    return {
      title: CATEGORY_TITLES[category as ProductType],
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
