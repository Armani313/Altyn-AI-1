'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Menu, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
}

export function Navbar() {
  const t        = useTranslations('nav')
  const pathname = usePathname()
  const router   = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#features', label: t('features') },
    { href: '#pricing',  label: t('pricing')  },
  ]

  function switchLocale(locale: string) {
    router.replace(pathname, { locale })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E5DDD1] shadow-soft'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg gradient-rose-gold flex items-center justify-center">
            <span className="text-white text-xs font-bold font-serif">L</span>
          </div>
          <span className="font-serif text-lg font-semibold text-foreground tracking-tight">
            Luminify
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-cream-200"
                aria-label="Change language"
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

          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-cream-200"
            >
              {t('login')}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft transition-all duration-200 hover:shadow-glow"
            >
              {t('startFree')}
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden w-11 h-11">
              <Menu className="h-5 w-5 text-foreground" />
              <span className="sr-only">{t('openMenu')}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#FAF9F6] border-l border-cream-200 w-[min(288px,90vw)]">
            <SheetHeader className="text-left mb-8">
              <SheetTitle className="font-serif text-lg font-semibold text-foreground">
                {t('menu')}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3.5 rounded-lg text-base text-foreground hover:bg-cream-200 transition-colors touch-manipulation"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-cream-200">
              {/* Mobile language switcher */}
              <div className="flex gap-2">
                {routing.locales.map((locale) => (
                  <button
                    key={locale}
                    onClick={() => { switchLocale(locale); setOpen(false) }}
                    className="flex-1 py-2 text-sm border border-cream-300 rounded-lg text-muted-foreground hover:text-foreground hover:bg-cream-100 transition-colors"
                  >
                    {LOCALE_LABELS[locale]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full border-cream-300">
                  {t('login')}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-primary hover:bg-rose-gold-600 text-white">
                  {t('startFree')}
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
