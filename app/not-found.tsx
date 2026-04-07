import { cookies } from 'next/headers'
import Link from 'next/link'
import { Wand2, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value === 'ru' ? 'ru' : 'en'
  const copy = locale === 'ru'
    ? {
        title: 'Страница не найдена',
        body: 'Такой страницы не существует или она была перемещена. Проверьте адрес или вернитесь на главную.',
        home: 'На главную',
        studio: 'В студию',
        homeHref: '/ru',
        studioHref: '/ru/dashboard',
      }
    : {
        title: 'Page not found',
        body: 'This page does not exist or has been moved. Check the address or go back to the homepage.',
        home: 'Back home',
        studio: 'Open studio',
        homeHref: '/',
        studioHref: '/dashboard',
      }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* 404 decoration */}
        <div className="relative mb-8 inline-block">
          <span className="font-serif text-[7rem] font-bold leading-none text-cream-200 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full gradient-rose-gold flex items-center justify-center shadow-glow">
              <span className="text-white text-2xl font-bold font-serif">L</span>
            </div>
          </div>
        </div>

        <h1 className="font-serif text-2xl font-medium text-foreground mb-3">
          {copy.title}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          {copy.body}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={copy.homeHref}>
            <Button
              className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 h-11 px-6 w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              {copy.home}
            </Button>
          </Link>
          <Link href={copy.studioHref}>
            <Button
              variant="outline"
              className="border-cream-300 text-muted-foreground hover:bg-cream-200 hover:text-foreground h-11 px-6 w-full sm:w-auto"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {copy.studio}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
