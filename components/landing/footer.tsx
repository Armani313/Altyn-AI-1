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
    { label: t('catJewelry'), href: '/dashboard' },
    { label: t('catScarves'), href: '/dashboard' },
    { label: t('catWatches'), href: '/dashboard' },
    { label: t('catBags'), href: '/dashboard' },
    { label: t('catOuterwear'), href: '/dashboard' },
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
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
