import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const STEPS = [
  'Загрузите фото украшения',
  'Выберите позу модели',
  'Скачайте готовый контент',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#FAF9F6]">
      {/* ── Left decorative panel ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] bg-gradient-to-br from-rose-gold-400 via-rose-gold-500 to-rose-gold-700 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none"
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="font-serif text-white font-bold text-base">N</span>
            </div>
            <span className="font-serif text-xl font-semibold text-white tracking-tight">
              Nurai AI Studio
            </span>
          </div>
        </div>

        {/* Headline + steps */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-serif text-3xl xl:text-4xl font-medium text-white leading-snug mb-3">
              Ювелирный контент<br />
              <em className="not-italic text-white/80">без фотостудии</em>
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              Загружайте фото украшений и получайте профессиональные лайфстайл-снимки
              за несколько секунд.
            </p>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-white/90 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Trust strip */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
            <Sparkles className="w-4 h-4 text-white flex-shrink-0" />
            <p className="text-white/90 text-xs leading-relaxed">
              <strong className="font-semibold">3 генерации бесплатно</strong> при регистрации.
              Без привязки карты.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-rose-gold flex items-center justify-center">
              <span className="text-white text-sm font-bold font-serif">N</span>
            </div>
            <span className="font-serif text-lg font-semibold text-foreground">
              Nurai AI Studio
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
