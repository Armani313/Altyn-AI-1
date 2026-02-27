'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const profileSchema = z.object({
  business_name: z.string().min(1, 'Укажите название магазина').max(200),
  contact_name:  z.string().min(1, 'Укажите ваше имя').max(100),
  phone:         z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Неверный формат телефона').or(z.literal('')),
})

type ProfileInput = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: {
    business_name: string
    contact_name:  string
    phone:         string
  }
  email: string
}

export function ProfileForm({ initialData, email }: ProfileFormProps) {
  const [saved, setSaved]       = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: ProfileInput) => {
    setServerError('')
    setSaved(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        business_name: data.business_name,
        contact_name:  data.contact_name,
        phone:         data.phone || null,
      } as never)
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')

    if (error) {
      setServerError('Ошибка при сохранении. Попробуйте снова.')
      return
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Email</Label>
        <Input
          value={email}
          disabled
          className="h-11 bg-cream-50 border-cream-300 text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          Email изменить нельзя — он используется для входа
        </p>
      </div>

      {/* Business name */}
      <div className="space-y-1.5">
        <Label htmlFor="business_name" className="text-sm font-medium">
          Название магазина
        </Label>
        <Input
          id="business_name"
          placeholder="Ювелирный салон «Жасмин»"
          className={`h-11 bg-white border-cream-300 focus:border-primary ${
            errors.business_name ? 'border-destructive' : ''
          }`}
          {...register('business_name')}
        />
        {errors.business_name && (
          <p className="text-xs text-destructive">{errors.business_name.message}</p>
        )}
      </div>

      {/* Two columns: name + phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name" className="text-sm font-medium">
            Ваше имя
          </Label>
          <Input
            id="contact_name"
            placeholder="Айгерим"
            className={`h-11 bg-white border-cream-300 focus:border-primary ${
              errors.contact_name ? 'border-destructive' : ''
            }`}
            {...register('contact_name')}
          />
          {errors.contact_name && (
            <p className="text-xs text-destructive">{errors.contact_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">
            Телефон
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+7 777 000 00 00"
            className={`h-11 bg-white border-cream-300 focus:border-primary ${
              errors.phone ? 'border-destructive' : ''
            }`}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Error */}
      {serverError && (
        <div className="flex items-center gap-2 bg-destructive/8 border border-destructive/20 text-destructive text-sm p-3.5 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* Save button + success */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="h-11 px-6 bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Сохраняем...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Сохранить
            </span>
          )}
        </Button>

        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            Сохранено
          </span>
        )}
      </div>
    </form>
  )
}
