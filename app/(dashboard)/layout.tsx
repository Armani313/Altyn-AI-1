import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('contact_name, business_name, credits_remaining, plan')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <Sidebar profile={profile} />
      <div className="flex-1 lg:ml-[240px] min-w-0">{children}</div>
    </div>
  )
}
