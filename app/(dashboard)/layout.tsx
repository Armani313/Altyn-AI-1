import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import type { Profile } from '@/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('contact_name, business_name, credits_remaining, plan')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Pick<
    Profile,
    'contact_name' | 'business_name' | 'credits_remaining' | 'plan'
  > | null

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar profile={profile} />

      <div className="flex-1 lg:ml-[240px] min-w-0 flex flex-col">
        {/* Mobile top bar — hidden on desktop */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-200 bg-white lg:hidden">
          <MobileNav profile={profile} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-rose-gold flex items-center justify-center">
              <span className="text-white text-[10px] font-bold font-serif">N</span>
            </div>
            <span className="font-serif text-sm font-semibold text-foreground tracking-tight">
              Nurai AI Studio
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
