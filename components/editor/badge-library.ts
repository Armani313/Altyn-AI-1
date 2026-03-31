export interface BadgeItem {
  id: string
  /** Label shown in the picker panel */
  label: string
  /** Default text placed on the badge (editable on canvas) */
  text: string
  category: 'sale' | 'premium' | 'info'
  /** Shape of the badge background */
  shape: 'rect' | 'pill' | 'circle'
  /** Background fill color */
  fill: string
  /** Text color */
  textColor: string
  /** Font family */
  fontFamily: 'Inter' | 'Playfair Display'
  /** Font size at base scale */
  fontSize: number
  /** Width of the badge (ignored for circle — uses `size`) */
  width?: number
  /** Height of the badge (ignored for circle — uses `size`) */
  height?: number
  /** Diameter for circle badges */
  size?: number
  /** Border radius for rect badges */
  rx?: number
}

export const BADGES: BadgeItem[] = [
  {
    id: 'sale-red',
    label: 'Скидка',
    text: 'SALE',
    category: 'sale',
    shape: 'rect',
    fill: '#ef4444',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 16,
    width: 120,
    height: 40,
    rx: 8,
  },
  {
    id: 'sale-percent',
    label: '-20%',
    text: '-20%',
    category: 'sale',
    shape: 'circle',
    fill: '#ef4444',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 20,
    size: 80,
  },
  {
    id: 'premium-gold',
    label: 'Премиум',
    text: 'PREMIUM',
    category: 'premium',
    shape: 'rect',
    fill: '#C4834F',
    textColor: '#ffffff',
    fontFamily: 'Playfair Display',
    fontSize: 15,
    width: 140,
    height: 40,
    rx: 8,
  },
  {
    id: 'new-badge',
    label: 'Новинка',
    text: 'NEW',
    category: 'info',
    shape: 'pill',
    fill: '#10b981',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 14,
    width: 100,
    height: 40,
  },
  {
    id: 'hit-badge',
    label: 'Хит',
    text: 'ХИТ',
    category: 'info',
    shape: 'rect',
    fill: '#8b5cf6',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 14,
    width: 80,
    height: 40,
    rx: 8,
  },
  {
    id: 'free-ship',
    label: 'Бесплатная доставка',
    text: 'БЕСПЛАТНАЯ ДОСТАВКА',
    category: 'info',
    shape: 'pill',
    fill: '#0ea5e9',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 12,
    width: 180,
    height: 36,
  },
  {
    id: 'kaspi-badge',
    label: 'Kaspi Магазин',
    text: 'KASPI МАГАЗИН',
    category: 'premium',
    shape: 'rect',
    fill: '#f14635',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 14,
    width: 160,
    height: 40,
    rx: 8,
  },
  {
    id: 'warranty',
    label: 'Гарантия',
    text: 'ГАРАНТИЯ ✦',
    category: 'premium',
    shape: 'rect',
    fill: '#1a1a1a',
    textColor: '#C4834F',
    fontFamily: 'Inter',
    fontSize: 13,
    width: 140,
    height: 40,
    rx: 8,
  },
]
