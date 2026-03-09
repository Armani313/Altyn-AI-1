'use client'

import { useState } from 'react'
import { Tag, Building2, AlignLeft, ChevronDown } from 'lucide-react'

interface CardProductFormProps {
  productName:              string
  brandName:                string
  productDescription:       string
  onProductNameChange:      (v: string) => void
  onBrandNameChange:        (v: string) => void
  onProductDescriptionChange: (v: string) => void
  disabled?:                boolean
}

export function CardProductForm({
  productName,
  brandName,
  productDescription,
  onProductNameChange,
  onBrandNameChange,
  onProductDescriptionChange,
  disabled = false,
}: CardProductFormProps) {
  const [descOpen, setDescOpen] = useState(false)

  const inputCls =
    'w-full h-10 pl-9 pr-3 rounded-xl border border-cream-200 bg-cream-50 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-rose-gold-300 focus:border-transparent transition-all disabled:opacity-60'

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Информация о продукте
      </p>

      {/* Product name */}
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={productName}
          onChange={(e) => onProductNameChange(e.target.value)}
          disabled={disabled}
          placeholder="Название продукта"
          maxLength={100}
          className={inputCls}
        />
      </div>

      {/* Brand name */}
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={brandName}
          onChange={(e) => onBrandNameChange(e.target.value)}
          disabled={disabled}
          placeholder="Название бренда"
          maxLength={60}
          className={inputCls}
        />
      </div>

      {/* Description — collapsible */}
      <div className="rounded-xl border border-cream-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setDescOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-cream-50"
        >
          <span className="flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-muted-foreground/50" />
            <span className="font-medium">
              {productDescription.trim() ? 'Описание добавлено' : 'Добавить описание'}
            </span>
            {productDescription.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-gold-400" />
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${descOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {descOpen && (
          <div className="px-3 pb-3 bg-white border-t border-cream-100">
            <textarea
              value={productDescription}
              onChange={(e) => onProductDescriptionChange(e.target.value)}
              disabled={disabled}
              placeholder="Опишите продукт, его особенности, ключевые характеристики…"
              maxLength={500}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-rose-gold-300 focus:border-transparent transition-all disabled:opacity-60"
            />
            <div className="flex justify-end mt-1">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {productDescription.length}/500
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
