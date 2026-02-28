'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterInput } from '@/lib/validations'

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setServerError('')
    const supabase = createClient()

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.contact_name,
          business_name: data.business_name,
          phone: data.phone,
        },
      },
    })

    if (error) {
      setServerError(
        error.message.includes('already registered')
          ? 'Пользователь с таким email уже зарегистрирован.'
          : 'Произошла ошибка при регистрации. Попробуйте позже.'
      )
      return
    }

    if (authData.session) {
      // Email confirmation disabled — session ready, redirect immediately
      setHasSession(true)
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1200)
    } else {
      // Email confirmation enabled — show "check your email" message
      setHasSession(false)
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
          Аккаунт создан!
        </h2>
        <p className="text-muted-foreground text-sm">
          {hasSession
            ? 'Перенаправляем в студию...'
            : 'Мы отправили письмо для подтверждения. Проверьте почту и перейдите по ссылке.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-medium text-foreground mb-1.5">
          Создать аккаунт
        </h1>
        <p className="text-muted-foreground text-sm">
          3 бесплатные генерации сразу после регистрации
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {serverError && (
          <div className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 text-destructive text-sm p-3.5 rounded-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

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

        {/* Two columns: contact name + phone */}
        <div className="grid sm:grid-cols-2 gap-3">
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

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            className={`h-11 bg-white border-cream-300 focus:border-primary ${
              errors.email ? 'border-destructive' : ''
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Пароль
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
              className={`h-11 pr-10 bg-white border-cream-300 focus:border-primary ${
                errors.password ? 'border-destructive' : ''
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 mt-1"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Создаём аккаунт...
            </span>
          ) : (
            'Зарегистрироваться бесплатно'
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Нажимая кнопку, вы соглашаетесь с{' '}
          <a href="/terms" className="underline hover:text-foreground">
            условиями использования
          </a>
        </p>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link
          href="/login"
          className="text-primary hover:text-rose-gold-600 font-medium transition-colors"
        >
          Войти
        </Link>
      </p>
    </div>
  )
}
