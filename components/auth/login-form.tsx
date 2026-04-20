'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

export function LoginForm() {
  const t = useTranslations('auth.login')
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setServerError('')
    setGoogleLoading(true)
    void trackAmplitudeEvent('login_google_clicked', { provider: 'google' })
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      void trackAmplitudeEvent('login_failed', {
        method: 'google',
        reason: 'oauth_error',
      })
      setServerError(t('errorGeneric'))
      setGoogleLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    void trackAmplitudeEvent('login_submitted', { method: 'password' })
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      void trackAmplitudeEvent('login_failed', {
        method: 'password',
        reason: error.message.includes('Invalid login credentials')
          ? 'invalid_credentials'
          : 'unknown',
      })
      setServerError(
        error.message.includes('Invalid login credentials')
          ? t('errorInvalidCredentials')
          : t('errorGeneric')
      )
      return
    }

    try {
      await fetch('/api/auth/claim-trial', { method: 'POST' })
    } catch (claimError) {
      console.warn('[Auth] Trial claim skipped after login:', claimError)
    }

    void trackAmplitudeEvent('login_succeeded', { method: 'password' })
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-serif text-3xl font-medium text-foreground mb-1.5">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 text-destructive text-sm p-3.5 rounded-xl">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {t('email')}
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
              {t('password')}
            </Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:text-rose-gold-600 transition-colors">
              {t('forgotPassword')}
            </Link>
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
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="sr-only">
                {showPassword ? t('hidePassword') : t('showPassword')}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow transition-all duration-300 mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              {t('loading')}
            </span>
          ) : (
            t('submit')
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-cream-300" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">{t('orContinueWith')}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
        className="w-full h-11 border-cream-300 hover:bg-cream-50 transition-all duration-300"
      >
        {googleLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
            {t('loading')}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('continueWithGoogle')}
          </span>
        )}
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link
          href="/register"
          className="text-primary hover:text-rose-gold-600 font-medium transition-colors"
        >
          {t('register')}
        </Link>
      </p>
    </div>
  )
}
