import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wand2, ImageIcon } from 'lucide-react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { LibraryGrid } from '@/components/library/library-grid'
import type { Generation } from '@/types/database.types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'library' })
  return { title: t('title') }
}

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'library' })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    redirect(loginPath)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', user.id)
    .single()

  const { data: generationsRaw } = await supabase
    .from('generations')
    .select('id, status, output_image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(48)

  const items = (generationsRaw ?? []) as Generation[]

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        profile={profile}
      />

      <div className="flex-1 p-3 sm:p-5 xl:p-6">
        <div className="max-w-6xl mx-auto">

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-24 text-center">
              <div className="relative mb-8">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-gold-100 to-rose-gold-200 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-gold-200 to-rose-gold-300 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-rose-gold-600" />
                  </div>
                </div>
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-rose-gold-300 opacity-70" />
                <div className="absolute bottom-2 left-0 w-2 h-2 rounded-full bg-rose-gold-200" />
              </div>

              <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
                {t('empty')}
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
                {t('emptyDesc')}
              </p>

              <Link href={locale === 'en' ? '/dashboard' : `/${locale}/dashboard`}>
                <Button className="bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 h-11 px-6">
                  <Wand2 className="w-4 h-4 mr-2" />
                  {t('createFirst')}
                </Button>
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{items.length}</strong> {t('images')}
                </p>
              </div>
              <LibraryGrid generations={items} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
