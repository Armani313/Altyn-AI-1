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

export const CARD_TEMPLATE_CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'all',         label: 'Все' },
  { id: 'marketplace', label: 'Маркетплейс' },
  { id: 'lifestyle',   label: 'Лайфстайл' },
  { id: 'minimal',     label: 'Минимализм' },
  { id: 'luxury',      label: 'Люкс' },
]

export const MAX_CARD_TEMPLATES = 3
export const CUSTOM_CARD_TEMPLATE_ID = 'custom-card-template'
export const AI_FREE_CARD_ID = 'ai-free-card'
