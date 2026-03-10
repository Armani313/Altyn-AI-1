'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError(
        error.message.includes('Invalid login credentials')
          ? 'Неверный email или пароль. Попробуйте снова.'
          : 'Произошла ошибка. Попробуйте позже.'
      )
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-serif text-3xl font-medium text-foreground mb-1.5">
          Добро пожаловать
        </h1>
        <p className="text-muted-foreground text-sm">
          Войдите в свой аккаунт Nurai AI Studio
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Server error */}
        {serverError && (
          <div className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 text-destructive text-sm p-3.5 rounded-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            className={`h-11 bg-white border-cream-300 focus:border-primary focus:ring-primary/20 ${
              errors.email ? 'border-destructive focus:border-destructive' : ''
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Пароль
            </Label>
            <a
              href="#"
              className="text-xs text-primary hover:text-rose-gold-600 transition-colors"
            >
              Забыли пароль?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`h-11 pr-11 bg-white border-cream-300 focus:border-primary focus:ring-primary/20 ${
                errors.password ? 'border-destructive' : ''
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-9 h-9 flex items-center justify-center rounded-lg touch-manipulation"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="sr-only">
                {showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Входим...
            </span>
          ) : (
            'Войти'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нет аккаунта?{' '}
        <Link
          href="/register"
          className="text-primary hover:text-rose-gold-600 font-medium transition-colors"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  )
}
