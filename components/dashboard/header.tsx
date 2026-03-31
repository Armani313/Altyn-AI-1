'use client'

import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Zap, Gift, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { routing } from '@/i18n/routing'
import type { Profile } from '@/types/database.types'

const LOCALE_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
}

interface HeaderProps {
  title: string
  subtitle?: string
  profile: Pick<Profile, 'credits_remaining'> | null
  freeService?: boolean
}

export function Header({ title, subtitle, profile, freeService = false }: HeaderProps) {
  const t        = useTranslations('header')
  const credits  = profile?.credits_remaining ?? 0
  const pathname = usePathname()
  const router   = useRouter()

  function switchLocale(locale: string) {
    router.replace(pathname, { locale })
  }

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-cream-200 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="font-serif text-xl font-medium text-foreground">{title}</h1>
        {subtitle && (
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 sm:w-8 sm:h-8 text-muted-foreground hover:text-foreground hover:bg-cream-100"
              aria-label={t('changeLang')}
            >
              <Globe className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {routing.locales.map((locale) => (
              <DropdownMenuItem
                key={locale}
                onClick={() => switchLocale(locale)}
                className="cursor-pointer"
              >
                {LOCALE_LABELS[locale]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {freeService ? (
          /* Free service badge — no credits consumed */
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
            <Gift className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">{t('free')}</span>
          </div>
        ) : (
          /* Credits chip */
          <div className="flex items-center gap-1.5 bg-rose-gold-50 border border-rose-gold-100 rounded-full px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-gold-500" />
            <span className="text-xs font-semibold text-rose-gold-700">
              <span className="hidden sm:inline">{credits} {t('credits')}</span>
              <span className="sm:hidden">{credits}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
