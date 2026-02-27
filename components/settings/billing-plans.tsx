'use client'

import { useState } from 'react'
import { Check, Zap, Crown, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/types/database.types'

interface BillingPlansProps {
  currentPlan:   Plan
  expiresAt:     string | null
  creditsLeft:   number
}

interface PlanConfig {
  key:         Plan
  label:       string
  price:       string
  priceNote:   string
  credits:     number
  features:    string[]
  icon:        React.ElementType
  highlight:   boolean
}

const PLANS: PlanConfig[] = [
  {
    key:       'free',
    label:     'Бесплатный',
    price:     '0 ₸',
    priceNote: 'навсегда',
    credits:   3,
    features:  [
      '3 генерации всего',
      'Базовые шаблоны',
      'JPG-загрузка',
    ],
    icon:      Sparkles,
    highlight: false,
  },
  {
    key:       'starter',
    label:     'Старт',
    price:     '9 900 ₸',
    priceNote: 'в месяц',
    credits:   30,
    features:  [
      '30 генераций в месяц',
      'Все базовые шаблоны',
      'Приоритетная очередь',
      'Поддержка по email',
    ],
    icon:      Zap,
    highlight: false,
  },
  {
    key:       'pro',
    label:     'Бренд Бизнес',
    price:     '29 900 ₸',
    priceNote: 'в месяц',
    credits:   150,
    features:  [
      '150 генераций в месяц',
      'Премиум-шаблоны',
      'Приоритетная генерация',
      'Поддержка в WhatsApp',
      'Ранний доступ к новинкам',
    ],
    icon:      Crown,
    highlight: true,
  },
]

export function BillingPlans({ currentPlan, expiresAt, creditsLeft }: BillingPlansProps) {
  const [loading, setLoading] = useState<Plan | null>(null)
  const [error, setError]     = useState('')

  const handleBuy = async (planKey: Plan) => {
    if (planKey === 'free' || planKey === 'enterprise') return
    setError('')
    setLoading(planKey)

    try {
      const res  = await fetch('/api/payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Ошибка при создании платежа. Попробуйте снова.')
        return
      }

      // Redirect to Kaspi Pay
      window.location.href = data.paymentUrl
    } catch {
      setError('Ошибка соединения. Проверьте интернет и попробуйте снова.')
    } finally {
      setLoading(null)
    }
  }

  const expiryDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="space-y-6">
      {/* Current plan status */}
      <div className="bg-cream-100 rounded-2xl border border-cream-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Текущий тариф</p>
            <p className="font-serif text-lg font-medium text-foreground">
              {PLANS.find((p) => p.key === currentPlan)?.label ?? currentPlan}
            </p>
            {expiryDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Действует до {expiryDate}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-cream-200 shadow-soft">
            <Zap className="w-4 h-4 text-rose-gold-500" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-none">{creditsLeft}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">кредитов осталось</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/8 border border-destructive/20 text-destructive text-sm p-3.5 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const Icon      = plan.icon
          const isCurrent = currentPlan === plan.key
          const isFree    = plan.key === 'free'
          const isPaying  = loading === plan.key

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all duration-200 ${
                plan.highlight
                  ? 'border-primary bg-gradient-to-b from-rose-gold-50 to-white shadow-glow'
                  : isCurrent
                  ? 'border-rose-gold-200 bg-white shadow-soft'
                  : 'border-cream-200 bg-white hover:border-rose-gold-100 hover:shadow-soft'
              }`}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-soft">
                    Популярный
                  </span>
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Активен
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-4">
                <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center ${
                  plan.highlight ? 'gradient-rose-gold' : 'bg-cream-100'
                }`}>
                  <Icon className={`w-4.5 h-4.5 ${plan.highlight ? 'text-white' : 'text-rose-gold-600'}`} />
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground">
                  {plan.label}
                </h3>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground ml-1">{plan.priceNote}</span>
                </div>
                <p className="text-xs text-rose-gold-600 font-semibold mt-1">
                  {plan.credits} генераций
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="h-10 flex items-center justify-center text-sm text-muted-foreground font-medium">
                  Текущий тариф
                </div>
              ) : isFree ? (
                <div className="h-10 flex items-center justify-center text-sm text-muted-foreground">
                  —
                </div>
              ) : (
                <Button
                  onClick={() => handleBuy(plan.key)}
                  disabled={isPaying}
                  className={`w-full h-10 transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
                      : 'bg-cream-100 hover:bg-cream-200 text-foreground border border-cream-300'
                  }`}
                >
                  {isPaying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                      Перенаправляем...
                    </span>
                  ) : (
                    'Оплатить через Kaspi'
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Оплата через Kaspi Pay · Безопасная транзакция · Отмена в любой момент
      </p>
    </div>
  )
}
