import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const t = useTranslations('footer')

  const productLinks = [
    { label: t('features'), href: '#features' },
    { label: t('pricing'),  href: '#pricing'  },
    { label: t('portfolio'), href: '#'         },
  ]

  const companyLinks = [
    { label: t('about'),   href: '#'                    },
    { label: t('contact'), href: 'mailto:support@luminify.app' },
    { label: t('terms'),   href: '/terms'               },
  ]

  return (
    <footer className="bg-cream-100 border-t border-cream-200">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
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

          {/* Product links */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {t('product')}
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              {t('company')}
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </a>
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
