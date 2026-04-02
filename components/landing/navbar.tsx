'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Menu, Globe, Eraser, Square, Focus, Palette, ImagePlus, Sparkles, LayoutGrid, ArrowRight, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  const toolItems = [
    { icon: Eraser, label: t('toolRemoveBg'), desc: t('toolRemoveBgDesc'), href: '/tools/background-remover' },
    { icon: Square, label: t('toolWhiteBg'), desc: t('toolWhiteBgDesc'), href: '/tools/white-background' },
    { icon: Focus, label: t('toolBlurBg'), desc: t('toolBlurBgDesc'), href: '/tools/blur-background' },
    { icon: Palette, label: t('toolChangeBg'), desc: t('toolChangeBgDesc'), href: '/tools/change-background-color' },
    { icon: ImagePlus, label: t('toolAddBg'), desc: t('toolAddBgDesc'), href: '/tools/add-background' },
    { icon: Sparkles, label: t('toolGenerate'), desc: t('toolGenerateDesc'), href: '/editor' },
    { icon: LayoutGrid, label: t('toolCards'), desc: t('toolCardsDesc'), href: '/cards' },
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

        {/* Desktop nav with dropdowns */}
        <div className="hidden md:flex items-center">
          <NavigationMenu>
            <NavigationMenuList>
              {/* Tools dropdown */}
              <NavigationMenuItem>
                <Link href="/tools">
                  <NavigationMenuTrigger className="text-sm text-muted-foreground hover:text-foreground bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                    {t('tools')}
                  </NavigationMenuTrigger>
                </Link>
                <NavigationMenuContent>
                  <ul className="grid w-[340px] gap-1 p-3">
                    {toolItems.map((item) => (
                      <li key={item.label}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-cream-100 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-rose-gold-100 flex items-center justify-center flex-shrink-0">
                              <item.icon className="w-4 h-4 text-rose-gold-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                    <li className="border-t border-cream-200 mt-1 pt-1">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/tools"
                          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 hover:bg-cream-100 transition-colors text-sm font-medium text-primary"
                        >
                          {t('allTools')}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Pricing link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a
                    href="#pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-2"
                  >
                    {t('pricing')}
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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

          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft transition-all duration-200 hover:shadow-glow gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </Button>
            </Link>
          ) : (
            <>
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
            </>
          )}
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
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="font-serif text-lg font-semibold text-foreground">
                {t('menu')}
              </SheetTitle>
            </SheetHeader>

            {/* Mobile tools section */}
            <div className="mb-2">
              <Link
                href="/tools"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 mb-2"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('tools')}
                </p>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
              <div className="flex flex-col gap-0.5">
                {toolItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-cream-200 transition-colors touch-manipulation"
                  >
                    <item.icon className="w-4 h-4 text-rose-gold-600" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="block px-3 py-3.5 rounded-lg text-base text-foreground hover:bg-cream-200 transition-colors touch-manipulation"
            >
              {t('pricing')}
            </a>

            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-cream-200">
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
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-rose-gold-600 text-white gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    {t('dashboard')}
                  </Button>
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
