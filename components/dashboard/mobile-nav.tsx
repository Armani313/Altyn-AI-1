'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Wand2, LayoutGrid, Images, Settings, LogOut, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { logout } from '@/lib/supabase/actions'
import type { Profile } from '@/types/database.types'
import { PLAN_META } from '@/lib/config/plans'

interface MobileNavProps {
  profile: Pick<Profile, 'contact_name' | 'business_name' | 'credits_remaining' | 'plan'> | null
}

const CREATE_ITEMS = [
  { href: '/dashboard', icon: Wand2,      label: 'Лайфстайл фото'   },
  { href: '/cards',     icon: LayoutGrid, label: 'Карточки товаров' },
]

export function MobileNav({ profile }: MobileNavProps) {
  const [open, setOpen]  = useState(false)
  const pathname         = usePathname()
  const plan             = profile?.plan ?? 'free'
  const credits          = profile?.credits_remaining ?? 0
  const planMeta         = PLAN_META[plan]

  const navLinkCls = (href: string) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      pathname === href
        ? 'bg-rose-gold-50 text-rose-gold-700 border border-rose-gold-100'
        : 'text-muted-foreground hover:bg-cream-100 hover:text-foreground'
    }`

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-11 h-11 text-muted-foreground hover:bg-cream-100"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[260px] p-0 bg-white border-r border-cream-200 flex flex-col max-h-screen overflow-hidden">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-cream-200">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="w-7 h-7 rounded-lg gradient-rose-gold flex items-center justify-center">
              <span className="text-white text-xs font-bold font-serif">N</span>
            </div>
            <span className="font-serif text-base font-semibold text-foreground tracking-tight">
              Nurai AI Studio
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

          {/* Create section */}
          <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
            Создать
          </p>
          {CREATE_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={navLinkCls(href)}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${pathname === href ? 'text-rose-gold-600' : ''}`} />
              {label}
            </Link>
          ))}

          <div className="py-2">
            <hr className="border-cream-200" />
          </div>

          {/* Library */}
          <Link href="/library" onClick={() => setOpen(false)} className={navLinkCls('/library')}>
            <Images className={`w-4 h-4 flex-shrink-0 ${pathname === '/library' ? 'text-rose-gold-600' : ''}`} />
            Библиотека
          </Link>

          <div className="py-2">
            <hr className="border-cream-200" />
          </div>

          {/* Settings */}
          <Link href="/settings" onClick={() => setOpen(false)} className={navLinkCls('/settings')}>
            <Settings className={`w-4 h-4 flex-shrink-0 ${pathname === '/settings' ? 'text-rose-gold-600' : ''}`} />
            Настройки
          </Link>
        </nav>

        {/* Credits + user */}
        <div className="px-3 py-4 border-t border-cream-200 space-y-3">
          {/* Credits widget */}
          <div className="bg-cream-100 rounded-xl p-3.5 border border-cream-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-gold-500" />
                <span className="text-xs font-semibold text-foreground">Кредиты</span>
              </div>
              <span className="text-xs text-muted-foreground">{planMeta.label}</span>
            </div>

            <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((credits / planMeta.credits) * 100, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{credits}</strong> осталось
              </span>
              {plan === 'free' && (
                <Link
                  href="/settings/billing"
                  onClick={() => setOpen(false)}
                  className="text-[10px] font-semibold text-primary hover:text-rose-gold-600 transition-colors"
                >
                  Улучшить →
                </Link>
              )}
            </div>
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full gradient-rose-gold flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {profile?.contact_name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {profile?.contact_name ?? 'Пользователь'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {profile?.business_name ?? ''}
              </p>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-cream-200 flex-shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="sr-only">Выйти</span>
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
