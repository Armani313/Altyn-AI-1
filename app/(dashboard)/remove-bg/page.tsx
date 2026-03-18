import { redirect }         from 'next/navigation'
import { createClient }     from '@/lib/supabase/server'
import { Header }           from '@/components/dashboard/header'
import { BgRemovalEditor }  from '@/components/remove-bg/BgRemovalEditor'

export const metadata = { title: 'Редактор фона' }

export default async function RemoveBgPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="flex flex-col min-h-screen">
      <Header
        title="Редактор фона"
        subtitle="Удаление фона и замена — прямо в браузере, без сервера"
        profile={null}
        freeService
      />
      <div className="flex-1 p-4 sm:p-6">
        <BgRemovalEditor />
      </div>
    </main>
  )
}
