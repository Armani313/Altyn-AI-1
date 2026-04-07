export type ToolLocale = 'en' | 'ru'

export type TopazToolSlug =
  | 'image-enhancer'
  | 'image-enlarger'
  | 'image-upscaler'
  | 'image-sharpener'
  | 'image-unblur'
  | 'image-denoiser'
  | 'face-enhancer'
  | 'photo-lighting'
  | 'photo-restoration'
  | 'ai-art-enhancer'
  | '3d-model-upscaler'
  | 'video-enhancer'
  | 'video-upscaler'
  | 'frame-interpolation'
  | 'video-sharpener'
  | 'hd-video-converter'
  | '4k-video-converter'
  | 'starlight'

export type TopazToolStatus = 'live' | 'soon'
export type TopazToolRuntime = 'image' | 'video'
export type TopazToolHeroMode = 'scale' | 'process' | 'soon'
export type TopazToolProcessor =
  | 'enhance'
  | 'enhance-faces'
  | 'enhance-art'
  | 'enhance-cgi'
  | 'sharpen'
  | 'unblur'
  | 'denoise'
  | 'lighting'
  | 'restore'

interface ToolCopySeed {
  title: string
  description: string
  highlights: [string, string, string]
  keywords: string[]
}

interface TopazToolSeed {
  slug: TopazToolSlug
  status: TopazToolStatus
  runtime: TopazToolRuntime
  heroMode: TopazToolHeroMode
  processor?: TopazToolProcessor
  defaultScale?: '2x' | '4x'
  related: TopazToolSlug[]
  copy: Record<ToolLocale, ToolCopySeed>
}

export interface LocalizedTopazTool {
  slug: TopazToolSlug
  status: TopazToolStatus
  runtime: TopazToolRuntime
  heroMode: TopazToolHeroMode
  processor?: TopazToolProcessor
  defaultScale?: '2x' | '4x'
  related: TopazToolSlug[]
  title: string
  description: string
  highlights: [string, string, string]
  keywords: string[]
  badge: string
  metaTitle: string
  metaDescription: string
  featureTitle: string
  featureIntro: string
  howToOverline: string
  howToTitle: string
  steps: [string, string, string]
  faqTitle: string
  faqs: Array<{ q: string; a: string }>
  uploadTitle: string
  uploadBody: string
  uploadButton: string
  processingTitle: string
  processingHint: string
  resultLabel: string
  limitNote: string
  comingSoonTitle: string
  comingSoonBody: string
  comingSoonPoints: [string, string, string]
  comingSoonCta: string
  relatedTitle: string
}

const TOOL_SEEDS: Record<TopazToolSlug, TopazToolSeed> = {
  'image-enhancer': {
    slug: 'image-enhancer',
    status: 'live',
    runtime: 'image',
    heroMode: 'scale',
    processor: 'enhance',
    defaultScale: '2x',
    related: ['image-upscaler', 'image-sharpener', 'face-enhancer'],
    copy: {
      ru: {
        title: 'Улучшить качество фото',
        description: 'Повышайте чёткость и размер фото товара на передовых технологиях прямо в браузере.',
        highlights: ['Больше деталей без ручной ретуши', 'Хорошо подходит для карточек товара', 'Быстрый before/after результат'],
        keywords: ['улучшить качество фото', 'улучшить фото онлайн', 'улучшить фото товара', 'повысить качество изображения', 'photo enhancer'],
      },
      en: {
        title: 'Image Enhancer',
        description: 'Improve product photo clarity and resolution with an advanced online enhancer built for fast before/after workflows.',
        highlights: ['Cleaner detail without manual retouching', 'Made for product photos and listings', 'Fast before/after workflow'],
        keywords: ['image enhancer', 'enhance image online', 'improve image quality', 'product photo enhancer', 'photo enhancement tool'],
      },
    },
  },
  'image-enlarger': {
    slug: 'image-enlarger',
    status: 'live',
    runtime: 'image',
    heroMode: 'scale',
    processor: 'enhance',
    defaultScale: '4x',
    related: ['image-upscaler', 'image-enhancer', '3d-model-upscaler'],
    copy: {
      ru: {
        title: 'Увеличить фото без потери качества',
        description: 'Увеличивайте фото товаров для каталога, витрин и баннеров без лишней мягкости.',
        highlights: ['2x и 4x увеличение', 'Чёткие края и текстуры', 'Подходит для баннеров и каталога'],
        keywords: ['увеличить фото', 'увеличить фото без потери качества', 'image enlarger', 'увеличить изображение онлайн', 'увеличить фото товара'],
      },
      en: {
        title: 'Image Enlarger',
        description: 'Enlarge product images for catalogs, banners, and storefronts while keeping them clean and usable.',
        highlights: ['2x and 4x output modes', 'Sharper edges and texture', 'Great for banners and catalog assets'],
        keywords: ['image enlarger', 'enlarge image online', 'increase image size', 'enlarge photo without losing quality', 'product image enlarger'],
      },
    },
  },
  'image-upscaler': {
    slug: 'image-upscaler',
    status: 'live',
    runtime: 'image',
    heroMode: 'scale',
    processor: 'enhance',
    defaultScale: '4x',
    related: ['image-enhancer', 'image-enlarger', 'image-sharpener'],
    copy: {
      ru: {
        title: 'Image Upscaler',
        description: 'Делайте маленькие фото заметно чище и крупнее для маркетплейсов, карточек и витрин.',
        highlights: ['Слабые исходники выглядят увереннее', 'Подходит для e-commerce контента', 'Простой апскейл в один шаг'],
        keywords: ['image upscaler', 'апскейл изображения', 'увеличить разрешение фото', 'upscale image online', 'повысить разрешение изображения'],
      },
      en: {
        title: 'Image Upscaler',
        description: 'Upscale smaller product photos into cleaner, larger assets for marketplaces, stores, and product pages.',
        highlights: ['Makes weak source files more usable', 'Built for e-commerce assets', 'One-step upscaling flow'],
        keywords: ['image upscaler', 'upscale image online', 'increase image resolution', 'photo upscaler', 'upscale product photo'],
      },
    },
  },
  'image-sharpener': {
    slug: 'image-sharpener',
    status: 'live',
    runtime: 'image',
    heroMode: 'process',
    processor: 'sharpen',
    related: ['image-unblur', 'image-enhancer', 'image-denoiser'],
    copy: {
      ru: {
        title: 'Сделать фото чётче',
        description: 'Добавляйте аккуратную резкость фото товара, когда исходник выглядит мягко или слегка смазанно.',
        highlights: ['Чище контуры и детали', 'Без тяжёлого ручного редактирования', 'Удобно для каталогов и карточек'],
        keywords: ['сделать фото четче', 'повысить резкость фото', 'image sharpener', 'sharpen image online', 'резкость изображения онлайн'],
      },
      en: {
        title: 'Image Sharpener',
        description: 'Add cleaner sharpness to soft or slightly blurred product photos without a manual editing pass.',
        highlights: ['Cleaner contours and detail', 'No heavy manual editing', 'Useful for catalogs and listings'],
        keywords: ['image sharpener', 'sharpen image online', 'make photo sharper', 'sharpen product photo', 'photo sharpener'],
      },
    },
  },
  'image-unblur': {
    slug: 'image-unblur',
    status: 'live',
    runtime: 'image',
    heroMode: 'process',
    processor: 'unblur',
    related: ['image-sharpener', 'image-enhancer', 'face-enhancer'],
    copy: {
      ru: {
        title: 'Убрать размытие с фото',
        description: 'Вытягивайте детали из смазанных фото, когда товар снят не в идеальном фокусе.',
        highlights: ['Работает с более сложным blur', 'Помогает вернуть читаемость деталей', 'Подходит для фото с телефона'],
        keywords: ['убрать размытие с фото', 'unblur image', 'размытое фото исправить', 'remove blur from image', 'исправить смазанное фото'],
      },
      en: {
        title: 'Image Unblur',
        description: 'Recover cleaner detail from blurry product photos when the original focus or capture was not ideal.',
        highlights: ['Handles stronger blur scenarios', 'Restores usable detail', 'Works well with phone photos'],
        keywords: ['image unblur', 'unblur image online', 'remove blur from photo', 'fix blurry image', 'unblur product photo'],
      },
    },
  },
  'image-denoiser': {
    slug: 'image-denoiser',
    status: 'live',
    runtime: 'image',
    heroMode: 'process',
    processor: 'denoise',
    related: ['image-sharpener', 'photo-lighting', 'image-enhancer'],
    copy: {
      ru: {
        title: 'Убрать шум с фото',
        description: 'Чистите шум и лишнюю зернистость на фото товара, особенно после съёмки в плохом свете.',
        highlights: ['Чище тени и фон', 'Больше пользы из вечерних снимков', 'Сохраняет товар читаемым'],
        keywords: ['убрать шум с фото', 'image denoiser', 'denoise image online', 'убрать зерно с фото', 'очистить фото от шума'],
      },
      en: {
        title: 'Image Denoiser',
        description: 'Reduce noise and grain in product photos, especially from low-light captures and compressed files.',
        highlights: ['Cleaner shadows and background', 'Better low-light recovery', 'Keeps the product readable'],
        keywords: ['image denoiser', 'denoise image online', 'remove noise from image', 'photo denoiser', 'reduce image grain'],
      },
    },
  },
  'face-enhancer': {
    slug: 'face-enhancer',
    status: 'live',
    runtime: 'image',
    heroMode: 'scale',
    processor: 'enhance-faces',
    defaultScale: '2x',
    related: ['image-enhancer', 'image-unblur', 'photo-lighting'],
    copy: {
      ru: {
        title: 'Улучшить лицо на фото',
        description: 'Делайте лица на портретах и lifestyle-снимках чище и аккуратнее без тяжёлой ретуши.',
        highlights: ['Лучше для портретов и lifestyle', 'Более уверенные черты лица', 'Хорошо сочетается с апскейлом'],
        keywords: ['улучшить лицо на фото', 'face enhancer', 'улучшить портрет онлайн', 'enhance face photo', 'face enhancement tool'],
      },
      en: {
        title: 'Face Enhancer',
        description: 'Clean up faces in portraits and lifestyle images without a heavy manual retouching workflow.',
        highlights: ['Built for portraits and lifestyle', 'Cleaner facial detail', 'Works well together with upscaling'],
        keywords: ['face enhancer', 'enhance face photo', 'portrait enhancer', 'face photo enhancer', 'improve face quality'],
      },
    },
  },
  'photo-lighting': {
    slug: 'photo-lighting',
    status: 'live',
    runtime: 'image',
    heroMode: 'process',
    processor: 'lighting',
    related: ['image-denoiser', 'face-enhancer', 'image-enhancer'],
    copy: {
      ru: {
        title: 'Исправить свет на фото',
        description: 'Выравнивайте экспозицию и делайте фото товара живее, когда исходный свет был слабым или жёстким.',
        highlights: ['Более ровный свет', 'Лучше читается материал товара', 'Полезно для каталога и lifestyle'],
        keywords: ['исправить свет на фото', 'улучшить освещение фото', 'photo lighting enhancer', 'brighten image online', 'lighting correction photo'],
      },
      en: {
        title: 'Photo Lighting Enhancer',
        description: 'Balance exposure and improve lighting when the original photo feels flat, dark, or too harsh.',
        highlights: ['More balanced exposure', 'Makes materials easier to read', 'Useful for catalog and lifestyle shots'],
        keywords: ['photo lighting enhancer', 'improve image lighting', 'brighten image online', 'fix lighting in photo', 'lighting correction photo'],
      },
    },
  },
  'photo-restoration': {
    slug: 'photo-restoration',
    status: 'live',
    runtime: 'image',
    heroMode: 'process',
    processor: 'restore',
    related: ['ai-art-enhancer', 'image-enhancer', 'photo-lighting'],
    copy: {
      ru: {
        title: 'Восстановить старое фото',
        description: 'Очищайте старые фото от царапин и мелких дефектов, сохраняя общий характер кадра.',
        highlights: ['Убирает мелкие повреждения', 'Подходит для архивных фото', 'Помогает быстро привести фото в порядок'],
        keywords: ['восстановить старое фото', 'photo restoration', 'реставрация фото онлайн', 'restore old photo', 'убрать царапины с фото'],
      },
      en: {
        title: 'Photo Restoration',
        description: 'Clean old photos and reduce scratches or archival defects while preserving the feel of the original shot.',
        highlights: ['Reduces small physical defects', 'Useful for archival photos', 'Fast restoration workflow'],
        keywords: ['photo restoration', 'restore old photo', 'old photo restoration online', 'remove scratches from photo', 'archival photo repair'],
      },
    },
  },
  'ai-art-enhancer': {
    slug: 'ai-art-enhancer',
    status: 'live',
    runtime: 'image',
    heroMode: 'scale',
    processor: 'enhance-art',
    defaultScale: '2x',
    related: ['image-enhancer', '3d-model-upscaler', 'image-upscaler'],
    copy: {
      ru: {
        title: 'AI Art Enhancer',
        description: 'Улучшайте AI-арт, иллюстрации и digital-изображения на передовых технологиях без долгой доработки.',
        highlights: ['Подходит для AI-арта и иллюстраций', 'Добавляет более уверенную детализацию', 'Удобен для презентаций и контента'],
        keywords: ['ai art enhancer', 'улучшить ai арт', 'улучшить иллюстрацию онлайн', 'enhance ai generated image', 'art upscaler'],
      },
      en: {
        title: 'AI Art Enhancer',
        description: 'Improve AI-generated art and digital illustrations with a cleaner, more polished output.',
        highlights: ['Made for AI art and illustrations', 'Adds more confident detail', 'Useful for presentation and content assets'],
        keywords: ['ai art enhancer', 'enhance ai art', 'illustration enhancer', 'enhance ai generated image', 'art upscaler'],
      },
    },
  },
  '3d-model-upscaler': {
    slug: '3d-model-upscaler',
    status: 'live',
    runtime: 'image',
    heroMode: 'scale',
    processor: 'enhance-cgi',
    defaultScale: '4x',
    related: ['image-upscaler', 'ai-art-enhancer', 'image-enlarger'],
    copy: {
      ru: {
        title: '3D Model Upscaler',
        description: 'Увеличивайте рендеры, CGI и digital-макеты для карточек, презентаций и баннеров.',
        highlights: ['Оптимально для рендеров и CGI', 'Чище текстуры и края', 'Удобно для баннеров и презентаций'],
        keywords: ['3d model upscaler', 'увеличить рендер', 'upscale cgi image', 'увеличить 3d модель изображение', 'cgi upscaler'],
      },
      en: {
        title: '3D Model Upscaler',
        description: 'Upscale renders, CGI assets, and digital mockups for product pages, decks, and banner work.',
        highlights: ['Optimized for renders and CGI', 'Cleaner texture and edges', 'Useful for banners and presentations'],
        keywords: ['3d model upscaler', 'cgi upscaler', 'upscale render image', 'upscale 3d render', 'render enhancer'],
      },
    },
  },
  'video-enhancer': {
    slug: 'video-enhancer',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-upscaler', 'video-sharpener', 'frame-interpolation'],
    copy: {
      ru: {
        title: 'Video Enhancer',
        description: 'Отдельная страница для улучшения видео с прицелом на каталоги, рекламу и social-контент.',
        highlights: ['Чище картинка на видео', 'Полезно для роликов товара', 'Готовим отдельный video pipeline'],
        keywords: ['video enhancer', 'улучшить качество видео', 'улучшить видео онлайн', 'video enhancement tool', 'повысить качество видео'],
      },
      en: {
        title: 'Video Enhancer',
        description: 'A dedicated video enhancement page designed for product videos, ads, and social content.',
        highlights: ['Cleaner looking video', 'Useful for product clips', 'Dedicated video pipeline in progress'],
        keywords: ['video enhancer', 'enhance video online', 'improve video quality', 'video enhancement tool', 'product video enhancer'],
      },
    },
  },
  'video-upscaler': {
    slug: 'video-upscaler',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-enhancer', '4k-video-converter', 'hd-video-converter'],
    copy: {
      ru: {
        title: 'Video Upscaler',
        description: 'Страница для апскейла видео до более чистого и крупного формата для рекламы и витрин.',
        highlights: ['Апскейл видео под каталоги и ads', 'Отдельный поток обработки', 'Будет работать через очередь'],
        keywords: ['video upscaler', 'апскейл видео', 'увеличить разрешение видео', 'upscale video online', 'повысить качество видео'],
      },
      en: {
        title: 'Video Upscaler',
        description: 'A dedicated page for upscaling video into cleaner, larger outputs for ads, showcases, and product reels.',
        highlights: ['Upscaling for ads and storefront clips', 'Separate processing flow', 'Will run through queue-backed video jobs'],
        keywords: ['video upscaler', 'upscale video online', 'increase video resolution', 'video upscale tool', 'improve video resolution'],
      },
    },
  },
  'frame-interpolation': {
    slug: 'frame-interpolation',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-enhancer', 'video-upscaler', 'starlight'],
    copy: {
      ru: {
        title: 'Frame Interpolation',
        description: 'Отдельная страница для плавности движения и повышения FPS в видео.',
        highlights: ['Более плавное движение', 'Для reels, ads и product videos', 'Готовим отдельный upload и status flow'],
        keywords: ['frame interpolation', 'повысить fps видео', 'сделать видео плавнее', 'interpolate video frames', 'smooth video motion'],
      },
      en: {
        title: 'Frame Interpolation',
        description: 'A dedicated page for smoother motion and higher-FPS video enhancement workflows.',
        highlights: ['Smoother motion', 'Useful for reels and product videos', 'Dedicated upload and status flow in progress'],
        keywords: ['frame interpolation', 'interpolate video frames', 'increase video fps', 'smooth video motion', 'frame interpolation tool'],
      },
    },
  },
  'video-sharpener': {
    slug: 'video-sharpener',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-enhancer', 'video-upscaler', 'frame-interpolation'],
    copy: {
      ru: {
        title: 'Video Sharpener',
        description: 'Отдельная страница для повышения резкости роликов товара и контентных видео.',
        highlights: ['Чище детали в видео', 'Подходит для товарных роликов', 'Будет доступен отдельным видео-инструментом'],
        keywords: ['video sharpener', 'повысить резкость видео', 'sharpen video online', 'улучшить четкость видео', 'video detail enhancer'],
      },
      en: {
        title: 'Video Sharpener',
        description: 'A separate page focused on improving detail and sharpness in product and content videos.',
        highlights: ['Cleaner video detail', 'Useful for product clips', 'Will ship as a dedicated video tool'],
        keywords: ['video sharpener', 'sharpen video online', 'improve video sharpness', 'video detail enhancer', 'sharpen product video'],
      },
    },
  },
  'hd-video-converter': {
    slug: 'hd-video-converter',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-upscaler', '4k-video-converter', 'video-enhancer'],
    copy: {
      ru: {
        title: 'HD Video Converter',
        description: 'Страница для конвертации видео в аккуратный HD-формат для площадок и соцсетей.',
        highlights: ['Подготовка видео под публикацию', 'Полезно для маркетплейсов и соцсетей', 'Отдельный видео-конвертер в работе'],
        keywords: ['hd video converter', 'конвертировать видео в hd', 'улучшить видео до hd', 'hd video tool', 'video converter hd'],
      },
      en: {
        title: 'HD Video Converter',
        description: 'A dedicated page for converting video into clean HD-ready outputs for platforms and social channels.',
        highlights: ['Prepare video for publishing', 'Useful for marketplaces and social', 'Dedicated HD conversion flow in progress'],
        keywords: ['hd video converter', 'convert video to hd', 'hd video tool', 'video converter hd', 'video enhancement hd'],
      },
    },
  },
  '4k-video-converter': {
    slug: '4k-video-converter',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-upscaler', 'hd-video-converter', 'video-enhancer'],
    copy: {
      ru: {
        title: '4K Video Converter',
        description: 'Страница для подготовки более чистого 4K-видео под рекламу, витрины и презентации.',
        highlights: ['4K-ориентированный workflow', 'Для более премиального video output', 'Готовим отдельный long-running pipeline'],
        keywords: ['4k video converter', 'конвертировать видео в 4k', 'улучшить видео до 4k', '4k video enhancer', 'video converter 4k'],
      },
      en: {
        title: '4K Video Converter',
        description: 'A dedicated page for preparing cleaner 4K-ready video for ads, presentations, and showcase content.',
        highlights: ['4K-focused workflow', 'Made for premium video output', 'Separate long-running pipeline in progress'],
        keywords: ['4k video converter', 'convert video to 4k', '4k video enhancer', 'video converter 4k', '4k upscaler'],
      },
    },
  },
  starlight: {
    slug: 'starlight',
    status: 'soon',
    runtime: 'video',
    heroMode: 'soon',
    related: ['video-upscaler', 'frame-interpolation', 'video-enhancer'],
    copy: {
      ru: {
        title: 'Starlight Video',
        description: 'Отдельная страница для премиального video upscaling и восстановления сложных исходников.',
        highlights: ['Для самых слабых видео-исходников', 'Премиальный видео-поток', 'Сделаем отдельный launch после image-инструментов'],
        keywords: ['starlight video', 'premium video upscaling', 'улучшить старое видео', 'video restoration ai', 'video upscale premium'],
      },
      en: {
        title: 'Starlight Video',
        description: 'A dedicated page for premium video upscaling and restoration of difficult source footage.',
        highlights: ['For the weakest video sources', 'Premium video workflow', 'Launching after the image tool rollout'],
        keywords: ['starlight video', 'premium video upscaling', 'video restoration ai', 'restore low quality video', 'video upscale premium'],
      },
    },
  },
}

export const TOPAZ_TOOL_SLUGS = Object.keys(TOOL_SEEDS) as TopazToolSlug[]

export function isTopazToolSlug(value: string): value is TopazToolSlug {
  return value in TOOL_SEEDS
}

export function getTopazToolSeed(slug: TopazToolSlug): TopazToolSeed {
  return TOOL_SEEDS[slug]
}

function buildFaqs(locale: ToolLocale, seed: TopazToolSeed, copy: ToolCopySeed): Array<{ q: string; a: string }> {
  if (seed.status === 'soon') {
    return locale === 'ru'
      ? [
          { q: `Для чего нужна страница ${copy.title}?`, a: copy.description },
          { q: 'Когда инструмент станет доступен?', a: 'Сейчас мы выстраиваем отдельный video pipeline с загрузкой, очередью и статусами, чтобы запуск был стабильным.' },
          { q: 'Можно ли уже добавить страницу в SEO?', a: 'Да. Страница уже готова под поисковые запросы и будет постепенно усиливаться по мере запуска реального потока обработки.' },
        ]
      : [
          { q: `What is the ${copy.title} page for?`, a: copy.description },
          { q: 'When will this tool become available?', a: 'We are building a dedicated video pipeline with upload, queueing, and job status so the launch is stable.' },
          { q: 'Can this page already support SEO growth?', a: 'Yes. The page is already designed for search intent and will be strengthened further as the live processing flow launches.' },
        ]
  }

  return locale === 'ru'
    ? [
        { q: `Для каких задач подходит ${copy.title.toLowerCase()}?`, a: copy.description },
        { q: 'Какие форматы поддерживаются?', a: 'Для текущего image flow подходят JPG, PNG, WEBP и HEIC. Результат всегда возвращается как готовое изображение.' },
        { q: 'Подходит ли это для карточек товара?', a: 'Да. Инструмент собран под e-commerce сценарии: каталоги, маркетплейсы, баннеры и карточки товара.' },
      ]
    : [
        { q: `What is ${copy.title.toLowerCase()} best for?`, a: copy.description },
        { q: 'Which formats are supported?', a: 'The current image flow supports JPG, PNG, WEBP, and HEIC files. The processed result is returned as a ready-to-use image.' },
        { q: 'Is this suitable for product listings?', a: 'Yes. The tool is tuned for e-commerce workflows such as catalogs, marketplaces, banners, and product pages.' },
      ]
}

export function getLocalizedTopazTool(slug: TopazToolSlug, locale: ToolLocale): LocalizedTopazTool {
  const seed = TOOL_SEEDS[slug]
  const copy = seed.copy[locale]

  return {
    slug: seed.slug,
    status: seed.status,
    runtime: seed.runtime,
    heroMode: seed.heroMode,
    processor: seed.processor,
    defaultScale: seed.defaultScale,
    related: seed.related,
    title: copy.title,
    description: copy.description,
    highlights: copy.highlights,
    keywords: copy.keywords,
    badge: locale === 'ru'
      ? seed.runtime === 'image'
        ? 'На передовых технологиях'
        : 'Отдельный video workflow'
      : seed.runtime === 'image'
        ? 'Powered by advanced image technology'
        : 'Dedicated video workflow',
    metaTitle: locale === 'ru'
      ? `${copy.title} онлайн | Luminify`
      : `${copy.title} Online | Luminify`,
    metaDescription: copy.description,
    featureTitle: locale === 'ru' ? 'Почему это удобно' : 'Why it works well',
    featureIntro: locale === 'ru'
      ? 'Короткий и понятный flow без лишней ручной обработки.'
      : 'A short, practical flow built to keep manual work low.',
    howToOverline: locale === 'ru' ? 'Как это работает' : 'How it works',
    howToTitle: locale === 'ru'
      ? 'Три коротких шага'
      : 'Three quick steps',
    steps: locale === 'ru'
      ? [
          'Загрузите исходник и выберите режим обработки.',
          'Сервис обрабатывает фото на передовых технологиях.',
          'Скачайте итог и используйте его в карточке, каталоге или рекламе.',
        ]
      : [
          'Upload your source file and choose the processing mode.',
          'The service applies the selected enhancement with advanced processing.',
          'Download the result for listings, catalogs, ads, or storefronts.',
        ],
    faqTitle: 'FAQ',
    faqs: buildFaqs(locale, seed, copy),
    uploadTitle: locale === 'ru'
      ? `Загрузите изображение для: ${copy.title.toLowerCase()}`
      : `Upload an image for ${copy.title.toLowerCase()}`,
    uploadBody: locale === 'ru'
      ? 'Поддерживаются JPG, PNG, WEBP и HEIC. После обработки вы сразу увидите before/after.'
      : 'JPG, PNG, WEBP, and HEIC are supported. You will see the before/after result right away.',
    uploadButton: locale === 'ru' ? 'Выбрать изображение' : 'Choose image',
    processingTitle: locale === 'ru' ? 'Идёт обработка' : 'Processing',
    processingHint: locale === 'ru'
      ? 'Обычно это занимает от нескольких секунд до пары минут, в зависимости от режима.'
      : 'This usually takes from a few seconds to a couple of minutes depending on the mode.',
    resultLabel: locale === 'ru' ? 'Готовый результат' : 'Ready result',
    limitNote: locale === 'ru'
      ? 'Для облачного image flow лучше держать итог до 32 MP.'
      : 'For the cloud image flow, it is best to keep final output within 32 MP.',
    comingSoonTitle: locale === 'ru'
      ? `${copy.title} готовится к запуску`
      : `${copy.title} is coming soon`,
    comingSoonBody: locale === 'ru'
      ? 'Страница уже готова под SEO и структуру продукта. Сейчас мы собираем отдельный стабильный pipeline под video jobs.'
      : 'The page is already in place for SEO and product structure. We are now building a dedicated stable pipeline for video jobs.',
    comingSoonPoints: locale === 'ru'
      ? ['Отдельная очередь и статусы задач', 'Корректная работа с большими видеофайлами', 'Плавный rollout без сырого UX']
      : ['Dedicated queue and job statuses', 'Correct handling for large video files', 'A smoother rollout without fragile UX'],
    comingSoonCta: locale === 'ru' ? 'Следить за запуском' : 'Follow the launch',
    relatedTitle: locale === 'ru' ? 'Похожие инструменты' : 'Related tools',
  }
}

export function getLocalizedTopazTools(locale: ToolLocale): LocalizedTopazTool[] {
  return TOPAZ_TOOL_SLUGS.map((slug) => getLocalizedTopazTool(slug, locale))
}
