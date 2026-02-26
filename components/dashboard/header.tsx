import { Zap } from 'lucide-react'
import type { Profile } from '@/types/database.types'

interface HeaderProps {
  title: string
  subtitle?: string
  profile: Pick<Profile, 'credits_remaining'> | null
}

export function Header({ title, subtitle, profile }: HeaderProps) {
  const credits = profile?.credits_remaining ?? 0

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 bg-white/70 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="font-serif text-xl font-medium text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Credits chip */}
      <div className="flex items-center gap-1.5 bg-rose-gold-50 border border-rose-gold-100 rounded-full px-3 py-1.5">
        <Zap className="w-3.5 h-3.5 text-rose-gold-500" />
        <span className="text-xs font-semibold text-rose-gold-700">
          {credits} кредитов
        </span>
      </div>
    </div>
  )
}
