'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="relative mb-8 inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center mx-auto">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-gold-200 to-rose-gold-300 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-gold-600" />
            </div>
          </div>
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-rose-gold-300 opacity-70" />
          <div className="absolute bottom-2 left-0 w-2 h-2 rounded-full bg-rose-gold-200" />
        </div>

        <h1 className="font-serif text-2xl font-medium text-foreground mb-3">
          Что-то пошло не так
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Произошла непредвиденная ошибка. Мы уже знаем об этом.
          Попробуйте обновить страницу или вернитесь на главную.
        </p>

        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mb-6 font-mono">
            {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 h-11 px-6"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Попробовать снова
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="border-cream-300 text-muted-foreground hover:bg-cream-200 hover:text-foreground h-11 px-6 w-full sm:w-auto"
            >
              <Home className="w-4 h-4 mr-2" />
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
