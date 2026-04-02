import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Luminify — ИИ-фотографии украшений',
    short_name: 'Luminify',
    description: 'Генерируйте профессиональные лайфстайл-фотографии украшений с помощью ИИ.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F4',
    theme_color: '#C4834F',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
