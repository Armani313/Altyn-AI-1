'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navLinks = [
  { href: '#features', label: 'Возможности' },
  { href: '#pricing', label: 'Тарифы' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
            <span className="text-white text-xs font-bold font-serif">N</span>
          </div>
          <span className="font-serif text-lg font-semibold text-foreground tracking-tight">
            Nurai
            <span className="font-sans text-xs font-medium text-muted-foreground ml-1.5 align-middle">
              AI Studio
            </span>
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
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-cream-200"
            >
              Войти
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft transition-all duration-200 hover:shadow-glow"
            >
              Начать бесплатно
            </Button>
          </Link>
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden w-11 h-11">
              <Menu className="h-5 w-5 text-foreground" />
              <span className="sr-only">Открыть меню</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#FAF9F6] border-l border-cream-200 w-72">
            <SheetHeader className="text-left mb-8">
              <SheetTitle className="font-serif text-lg font-semibold text-foreground">
                Меню
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-base text-foreground hover:bg-cream-200 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-cream-200">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full border-cream-300">
                  Войти
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="w-full bg-primary hover:bg-rose-gold-600 text-white">
                  Начать бесплатно
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
