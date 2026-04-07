import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Luminify — AI jewelry photography',
    short_name: 'Luminify',
    description: 'Generate professional jewelry lifestyle photos with AI.',
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
