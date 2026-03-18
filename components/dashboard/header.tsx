import { Zap, Gift } from 'lucide-react'
import type { Profile } from '@/types/database.types'

interface HeaderProps {
  title: string
  subtitle?: string
  profile: Pick<Profile, 'credits_remaining'> | null
  freeService?: boolean
}

export function Header({ title, subtitle, profile, freeService = false }: HeaderProps) {
  const credits = profile?.credits_remaining ?? 0

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-cream-200 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="font-serif text-xl font-medium text-foreground">{title}</h1>
        {subtitle && (
          <p className="hidden sm:block text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {freeService ? (
        /* Free service badge — no credits consumed */
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
          <Gift className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-semibold text-green-700">Бесплатно</span>
        </div>
      ) : (
        /* Credits chip */
        <div className="flex items-center gap-1.5 bg-rose-gold-50 border border-rose-gold-100 rounded-full px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-rose-gold-500" />
          <span className="text-xs font-semibold text-rose-gold-700">
            <span className="hidden sm:inline">{credits} кредитов</span>
            <span className="sm:hidden">{credits}</span>
          </span>
        </div>
      )}
    </div>
  )
}
