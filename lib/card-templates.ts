export type CardCategory = 'all' | 'marketplace' | 'lifestyle' | 'minimal' | 'luxury'

export interface CardTemplate {
  id: string
  name: string
  category: Exclude<CardCategory, 'all'>
  /** URL to template image in /public */
  imageUrl: string
  label?: string
  premium?: boolean
}

export const CARD_TEMPLATES: CardTemplate[] = [
  { id: 'tpl-01', name: 'Шаблон 1',  category: 'marketplace', imageUrl: '/exCardTemplate/1.webp' },
  { id: 'tpl-02', name: 'Шаблон 2',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(1).webp' },
  { id: 'tpl-03', name: 'Шаблон 3',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(2).webp' },
  { id: 'tpl-04', name: 'Шаблон 4',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(4).webp' },
  { id: 'tpl-05', name: 'Шаблон 5',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(5).webp' },
  { id: 'tpl-06', name: 'Шаблон 6',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(6).webp' },
  { id: 'tpl-07', name: 'Шаблон 7',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(7).webp' },
  { id: 'tpl-08', name: 'Шаблон 8',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(8).webp' },
  { id: 'tpl-09', name: 'Шаблон 9',  category: 'marketplace', imageUrl: '/exCardTemplate/1%20(9).webp' },
  { id: 'tpl-10', name: 'Шаблон 10', category: 'marketplace', imageUrl: '/exCardTemplate/1%20(10).webp' },
  { id: 'tpl-11', name: 'Шаблон 11', category: 'marketplace', imageUrl: '/exCardTemplate/1%20(11).webp' },
  { id: 'tpl-12', name: 'Шаблон 12', category: 'marketplace', imageUrl: '/exCardTemplate/1%20(12).webp' },
  { id: 'tpl-13', name: 'Шаблон 13', category: 'lifestyle',   imageUrl: '/exCardTemplate/3.webp' },
  { id: 'tpl-14', name: 'Шаблон 14', category: 'lifestyle',   imageUrl: '/exCardTemplate/3%20(1).webp' },
  { id: 'tpl-15', name: 'Шаблон 15', category: 'minimal',     imageUrl: '/exCardTemplate/16966461.jpeg' },
  { id: 'tpl-16', name: 'Шаблон 16', category: 'minimal',     imageUrl: '/exCardTemplate/42262946.jpg' },
  { id: 'tpl-17', name: 'Шаблон 17', category: 'minimal',     imageUrl: '/exCardTemplate/65762494.jpg' },
  { id: 'tpl-18', name: 'Шаблон 18', category: 'minimal',     imageUrl: '/exCardTemplate/67520454.jpeg' },
  { id: 'tpl-19', name: 'Шаблон 19', category: 'minimal',     imageUrl: '/exCardTemplate/69281824.jpg' },
  { id: 'tpl-20', name: 'Шаблон 20', category: 'luxury',      imageUrl: '/exCardTemplate/82630358.jpeg' },
  { id: 'tpl-21', name: 'Шаблон 21', category: 'luxury',      imageUrl: '/exCardTemplate/86404261117982.jpg' },
  { id: 'tpl-22', name: 'Шаблон 22', category: 'luxury',      imageUrl: '/exCardTemplate/86492964225054.jpeg' },
  { id: 'tpl-23', name: 'Шаблон 23', category: 'luxury',      imageUrl: '/exCardTemplate/86668728434718.jpg' },
  { id: 'tpl-24', name: 'Шаблон 24', category: 'luxury',      imageUrl: '/exCardTemplate/95278492.jpeg' },
  { id: 'tpl-25', name: 'Шаблон 25', category: 'luxury',      imageUrl: '/exCardTemplate/99432248.jpeg' },
  { id: 'tpl-26', name: 'Шаблон 26', category: 'lifestyle',   imageUrl: '/exCardTemplate/107072579.jpg' },
  { id: 'tpl-27', name: 'Шаблон 27', category: 'lifestyle',   imageUrl: '/exCardTemplate/115446052.jpg' },
]

export const CARD_TEMPLATE_MAP = Object.fromEntries(
  CARD_TEMPLATES.map((t) => [t.id, t])
) as Record<string, CardTemplate>

export const CARD_TEMPLATE_CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'all',         label: 'Все' },
  { id: 'marketplace', label: 'Маркетплейс' },
  { id: 'lifestyle',   label: 'Лайфстайл' },
  { id: 'minimal',     label: 'Минимализм' },
  { id: 'luxury',      label: 'Люкс' },
]

export const MAX_CARD_TEMPLATES = 3
export const CUSTOM_CARD_TEMPLATE_ID = 'custom-card-template'
