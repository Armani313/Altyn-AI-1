'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Wand2, LayoutGrid, PenTool, Images, Settings, Scissors } from 'lucide-react'

export function BottomNav() {
  const t        = useTranslations('sidebar')
  const locale   = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const editorMode =
    pathname !== '/editor'
      ? null
      : searchParams.get('mode') === 'photo-editor' || searchParams.get('direct') === '1'
        ? 'photo-editor'
        : 'remove-bg'

  // Hard navigation required for /editor (ONNX Runtime CSP)
  const editorHref = locale === 'en' ? '/editor' : `/${locale}/editor`
  const photoEditorHref = `${editorHref}?mode=photo-editor`

  const items = [
    { href: '/dashboard', icon: Wand2,       label: t('lifestyle'), hardNav: false },
    { href: '/cards',     icon: LayoutGrid,  label: t('cards'),     hardNav: false },
    { href: editorHref,   icon: Scissors,    label: t('removeBg'),  hardNav: true  },
    { href: photoEditorHref, icon: PenTool,  label: t('editor'),    hardNav: true  },
    { href: '/library',   icon: Images,      label: t('library'),   hardNav: false },
    { href: '/settings',  icon: Settings,    label: t('settings'),  hardNav: false },
  ]

  const isActive = (href: string) =>
    pathname === href ||
    (href === editorHref && editorMode === 'remove-bg') ||
    (href === photoEditorHref && editorMode === 'photo-editor') ||
    (href === '/settings' && pathname.startsWith('/settings')) ||
    (href === '/dashboard' && pathname.startsWith('/dashboard/'))

  const hardNavigate = (href: string) => {
    window.location.assign(href)
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-cream-200 lg:hidden">
      <div
        className="flex items-end justify-around px-1"
        style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
      >
        {items.map(({ href, icon: Icon, label, hardNav }) => {
          const active = isActive(href)
          const cls = `flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 flex-1 min-w-[48px] min-h-[52px] transition-colors duration-150 touch-feedback ${
            active
              ? 'text-primary'
              : 'text-muted-foreground active:text-foreground'
          }`

          const content = (
            <>
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </>
          )

          return hardNav ? (
            <button
              key={href}
              type="button"
              onClick={() => hardNavigate(href)}
              className={`relative ${cls}`}
            >
              {content}
            </button>
          ) : (
            <Link key={href} href={href} className={`relative ${cls}`}>
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
