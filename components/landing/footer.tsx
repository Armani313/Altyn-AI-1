import { Separator } from '@/components/ui/separator'

const productLinks = [
  { label: 'Возможности', href: '#features' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'Примеры работ', href: '#' },
]

const companyLinks = [
  { label: 'О нас', href: '#' },
  { label: 'Связаться', href: '#' },
  { label: 'Политика конфиденциальности', href: '#' },
]

export function Footer() {
  return (
    <footer className="bg-cream-100 border-t border-cream-200">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg gradient-rose-gold flex items-center justify-center">
                <span className="text-white text-xs font-bold font-serif">N</span>
              </div>
              <span className="font-serif text-lg font-semibold text-foreground">
                Nurai AI Studio
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              ИИ-фото украшений для ювелирных магазинов Казахстана.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              🇰🇿 Алматы, Казахстан
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-sans font-semibold text-sm text-foreground mb-4">
              Продукт
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
              Компания
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
          <span>© 2025 Nurai AI Studio. Все права защищены.</span>
          <div className="flex items-center gap-1.5">
            <span>Оплата через</span>
            <span className="font-semibold text-foreground">Kaspi Pay</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
