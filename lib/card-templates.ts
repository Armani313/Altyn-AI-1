export type CardCategory = 'all' | 'marketplace' | 'lifestyle' | 'minimal' | 'luxury'

export interface CardTemplate {
  id: string
  name: string
  category: Exclude<CardCategory, 'all'>
  /** CSS `background` value used for preview */
  bgStyle: string
  /** Accent color dot in preview & result badge */
  dotColor: string
  label?: string
  premium?: boolean
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'white-studio',
    name: 'Белый студийный',
    category: 'marketplace',
    bgStyle: 'linear-gradient(160deg, #ffffff 0%, #f0ede8 100%)',
    dotColor: '#C4834F',
    label: 'Популярный',
  },
  {
    id: 'warm-sand',
    name: 'Тёплый песок',
    category: 'marketplace',
    bgStyle: 'linear-gradient(160deg, #f5ede0 0%, #e8d0b0 100%)',
    dotColor: '#b8834a',
  },
  {
    id: 'minimal-grey',
    name: 'Нейтральный серый',
    category: 'minimal',
    bgStyle: 'linear-gradient(160deg, #f5f5f5 0%, #e0ddd8 100%)',
    dotColor: '#9b8b7a',
  },
  {
    id: 'sage-green',
    name: 'Зелёный шалфей',
    category: 'minimal',
    bgStyle: 'linear-gradient(160deg, #e8ede0 0%, #c8d5b8 100%)',
    dotColor: '#6a8f5a',
    label: 'Новый',
  },
  {
    id: 'soft-pink',
    name: 'Пастельный розовый',
    category: 'lifestyle',
    bgStyle: 'linear-gradient(160deg, #fdf0f0 0%, #f5dada 100%)',
    dotColor: '#e88e8e',
  },
  {
    id: 'cool-blue',
    name: 'Голубой',
    category: 'minimal',
    bgStyle: 'linear-gradient(160deg, #e8f4ff 0%, #c0dff5 100%)',
    dotColor: '#5a9fd4',
  },
  {
    id: 'forest-green',
    name: 'Природа',
    category: 'lifestyle',
    bgStyle: 'linear-gradient(160deg, #2d4a2d 0%, #4a7c4a 100%)',
    dotColor: '#8bc98b',
  },
  {
    id: 'marble-white',
    name: 'Мрамор',
    category: 'minimal',
    bgStyle: 'linear-gradient(160deg, #f8f8f8 0%, #e8e4df 100%)',
    dotColor: '#9b8b7a',
  },
  {
    id: 'dark-luxury',
    name: 'Тёмный люкс',
    category: 'luxury',
    bgStyle: 'linear-gradient(160deg, #1c1a18 0%, #2d2520 100%)',
    dotColor: '#C4834F',
  },
  {
    id: 'gold-luxury',
    name: 'Золотой',
    category: 'luxury',
    bgStyle: 'linear-gradient(160deg, #4a3020 0%, #8b6540 50%, #c4934f 100%)',
    dotColor: '#f5d08a',
    premium: true,
  },
  {
    id: 'deep-night',
    name: 'Ночной синий',
    category: 'lifestyle',
    bgStyle: 'linear-gradient(160deg, #0d1117 0%, #1e2a3a 100%)',
    dotColor: '#4a8fd4',
    premium: true,
  },
  {
    id: 'lavender',
    name: 'Лавандовый',
    category: 'lifestyle',
    bgStyle: 'linear-gradient(160deg, #f0eeff 0%, #d8d0f5 100%)',
    dotColor: '#8a70d4',
  },
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
