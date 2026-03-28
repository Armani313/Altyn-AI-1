'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { User, CreditCard } from 'lucide-react'

export function SettingsTabs() {
  const t        = useTranslations('settingsTabs')
  const pathname = usePathname()

  const TABS = [
    { href: '/settings',         label: t('profile'), icon: User       },
    { href: '/settings/billing', label: t('billing'), icon: CreditCard },
  ]

  return (
    <div className="flex gap-1 p-1 bg-cream-100 rounded-xl mb-6 w-fit">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              active
                ? 'bg-white text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}
