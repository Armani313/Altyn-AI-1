'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Check, Zap, Crown, Sparkles, AlertCircle, ExternalLink, Building2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PolarEmbedCheckout } from '@polar-sh/checkout/embed'
import type { Plan } from '@/types/database.types'
import { CREDIT_PACK_META, CREDIT_PACK_KEYS, PLAN_META, type CreditPackKey } from '@/lib/config/plans'

interface BillingPlansProps {
  currentPlan:        Plan
  expiresAt:          string | null
  creditsLeft:        number
  cancelAtPeriodEnd?: boolean
}

export function BillingPlans({
  currentPlan,
  expiresAt,
  creditsLeft,
  cancelAtPeriodEnd = false,
}: BillingPlansProps) {
  const t = useTranslations('billingPlans')
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState<Plan | CreditPackKey | null>(null)
  const [error, setError]     = useState('')
  const checkoutRef = useRef<ReturnType<typeof PolarEmbedCheckout.create> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkoutRef.current) {
        checkoutRef.current.then(c => c.close()).catch(() => {})
      }
    }
  }, [])

  const PLANS = [
    {
      key:       'free' as Plan,
      label:     t('freeName'),
      price:     '$0',
      priceNote: t('freeForever'),
      credits:   PLAN_META.free.credits,
      features:  [t('freeFeature1'), t('freeFeature2'), t('freeFeature3')],
      icon:      Sparkles,
      highlight: false,
    },
    {
      key:       'starter' as Plan,
      label:     t('starterName'),
      price:     '$1',
      priceNote: t('perMonth'),
      credits:   PLAN_META.starter.credits,
      features:  [t('starterFeature1'), t('starterFeature2'), t('starterFeature3'), t('starterFeature4')],
      icon:      Zap,
      highlight: false,
    },
    {
      key:       'pro' as Plan,
      label:     t('proName'),
      price:     '$10',
      priceNote: t('perMonth'),
      credits:   PLAN_META.pro.credits,
      features:  [t('proFeature1'), t('proFeature2'), t('proFeature3'), t('proFeature4'), t('proFeature5')],
      icon:      Crown,
      highlight: true,
    },
    {
      key:       'business' as Plan,
      label:     t('businessName'),
      price:     '$25',
      priceNote: t('perMonth'),
      credits:   PLAN_META.business.credits,
      features:  [t('businessFeature1'), t('businessFeature2'), t('businessFeature3'), t('businessFeature4'), t('businessFeature5')],
      icon:      Building2,
      highlight: false,
    },
  ]

  const TOP_UP_PACKS = CREDIT_PACK_KEYS.map((packKey) => ({
    key: packKey,
    credits: CREDIT_PACK_META[packKey].credits,
    price: `$${CREDIT_PACK_META[packKey].priceUsd}`,
  }))

  const openCheckout = async (payload: { plan?: Plan; pack?: CreditPackKey }, loadingKey: Plan | CreditPackKey) => {
    setError('')
    setLoading(loadingKey)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || t('checkoutError'))
      }

      const { url } = await res.json()

      // Open Polar Embed overlay
      const checkout = PolarEmbedCheckout.create(url, {
        theme: 'light',
      })
      checkoutRef.current = checkout

      const instance = await checkout

      instance.addEventListener('success', () => {
        router.push(`/${locale}/settings/billing?status=success`)
      })

      instance.addEventListener('close', () => {
        setLoading(null)
        checkoutRef.current = null
      })
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err instanceof Error ? err.message : t('checkoutError'))
      setLoading(null)
    }
  }

  const handlePlanBuy = async (planKey: Plan) => {
    if (planKey === 'free') return
    await openCheckout({ plan: planKey }, planKey)
  }

  const handleTopUpBuy = async (packKey: CreditPackKey) => {
    await openCheckout({ pack: packKey }, packKey)
  }

  const expiryDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const planMonthlyCredits = PLAN_META[currentPlan].credits
  // Renewal hint only for paid plans that will actually renew. If cancellation
  // is scheduled, credits will not refresh — skip the hint and let the banner
  // speak for itself.
  const showRenewHint = currentPlan !== 'free' && !cancelAtPeriodEnd
  const renewHintText = showRenewHint
    ? (expiryDate
        ? t('renewHintWithDate', { n: planMonthlyCredits, date: expiryDate })
        : t('renewHint', { n: planMonthlyCredits }))
    : null

  return (
    <div className="space-y-6">
      {/* Cancellation pending banner (MED-3) */}
      {cancelAtPeriodEnd && expiryDate && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{t('cancellationBannerTitle')}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {t('cancellationBannerBody', { date: expiryDate })}
            </p>
          </div>
        </div>
      )}

      {/* Current plan status */}
      <div className="bg-cream-100 rounded-2xl border border-cream-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('currentPlanLabel')}</p>
            <p className="font-serif text-lg font-medium text-foreground">
              {PLANS.find((p) => p.key === currentPlan)?.label ?? currentPlan}
            </p>
            {expiryDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('activeUntil', { date: expiryDate })}
              </p>
            )}
            {currentPlan !== 'free' && (
              <button
                type="button"
                onClick={() => window.location.assign('/api/portal')}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2 mt-2"
              >
                {t('manageSubscription')}
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-cream-200 shadow-soft">
              <Zap className="w-4 h-4 text-rose-gold-500" />
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">{creditsLeft}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t('creditsLeft')}</p>
              </div>
            </div>
            {renewHintText && (
              <p className="text-[10px] text-muted-foreground text-right max-w-[220px]">
                {renewHintText}
              </p>
            )}
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {t('popular')}
                  </span>
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {t('active')}
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
                  {t('generations', { n: plan.credits })}
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
                  {t('currentPlanBtn')}
                </div>
              ) : isFree ? (
                <div className="h-10 flex items-center justify-center text-sm text-muted-foreground">
                  —
                </div>
              ) : (
                <Button
                  onClick={() => handlePlanBuy(plan.key)}
                  disabled={!!loading}
                  className={`w-full h-10 transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-primary hover:bg-rose-gold-600 text-white shadow-soft hover:shadow-glow'
                      : 'bg-cream-100 hover:bg-cream-200 text-foreground border border-cream-300'
                  }`}
                >
                  {isPaying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                      {t('loading')}
                    </span>
                  ) : (
                    t('pay')
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-cream-200 bg-cream-50/70 p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-gold-600">
            {t('topUpTitle')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('topUpSubtitle')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TOP_UP_PACKS.map((pack) => {
            const isBuying = loading === pack.key

            return (
              <div
                key={pack.key}
                className="rounded-2xl border border-cream-200 bg-white p-5 shadow-soft"
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-gold-600">
                    {t('topUpPackLabel', { n: pack.credits })}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-foreground">{pack.price}</span>
                    <span className="text-xs text-muted-foreground">{t('topUpOneTime')}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {t('topUpAddsCredits', { n: pack.credits })}
                  </p>
                </div>

                <ul className="mb-5 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {t('topUpFeature1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    {t('topUpFeature2')}
                  </li>
                </ul>

                <Button
                  onClick={() => handleTopUpBuy(pack.key)}
                  disabled={!!loading}
                  className="h-10 w-full border border-cream-300 bg-white text-foreground hover:bg-cream-100"
                >
                  {isBuying ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                      {t('loading')}
                    </span>
                  ) : (
                    t('buyCredits')
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        {t('securePayment')}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        {t('nonAccumulationNote')}
      </p>
    </div>
  )
}
