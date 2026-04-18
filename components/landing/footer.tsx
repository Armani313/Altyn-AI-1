import { useTranslations } from 'next-intl'
import NextLink from 'next/link'
import { Link } from '@/i18n/navigation'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const t = useTranslations('footer')

  const toolLinks = [
    { label: t('toolLifestyle'), href: '/dashboard' },
    { label: t('toolCards'), href: '/dashboard' },
    { label: t('toolRemoveBg'), href: '/dashboard' },
    { label: t('toolEditor'), href: '/dashboard' },
  ]

  const categoryLinks = [
    { label: t('catApparel'), href: '/categories/apparel' },
    { label: t('catCosmetics'), href: '/categories/cosmetics' },
    { label: t('catJewelry'), href: '/categories/jewelry' },
    { label: t('catBags'), href: '/categories/apparel' },
    { label: t('catMarketplaces'), href: '/categories/apparel' },
  ]

  const platforms = [
    t('platformShopify'),
    t('platformAmazon'),
    t('platformEtsy'),
    t('platformTikTok'),
    t('platformInstagram'),
    t('platformMeta'),
  ]

  const companyLinks = [
    { label: t('about'), href: '/about', localized: true },
    { label: t('faq'), href: '/faq', localized: true },
    { label: t('pricing'), href: '#pricing', localized: false },
    { label: t('contact'), href: '/contacts', localized: true },
    { label: t('privacy'), href: '/privacy', localized: false },
    { label: t('terms'), href: '/terms', localized: false },
  ]

  return (
    <footer className="bg-cream-100 border-t border-cream-200">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-7 h-7 rounded-lg gradient-rose-gold flex items-center justify-center">
                <span className="text-white text-xs font-bold font-serif">L</span>
              </div>
              <span className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                Luminify
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              {t('country')}
            </p>

            {/* Platforms strip */}
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                {t('platformsTitle')}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {platforms.map((p) => (
                  <span key={p} className="text-xs font-medium text-foreground/70">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {t('toolsTitle')}
            </h4>
            <ul className="space-y-2.5">
              {toolLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {t('categoriesTitle')}
            </h4>
            <ul className="space-y-2.5">
              {categoryLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {t('company')}
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  {link.localized ? (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <NextLink
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </NextLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-cream-300 mb-6" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <span>{t('copyright')}</span>
          <div className="flex items-center gap-1.5">
            <span>{t('paymentVia')}</span>
            <span className="font-semibold text-foreground">{t('paymentMethod')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
