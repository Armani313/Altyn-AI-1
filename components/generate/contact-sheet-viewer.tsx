'use client'

/**
 * ContactSheetViewer
 *
 * Displays 4 independent panel images produced by splitting a 2×2 contact sheet.
 * Thumbnails via Supabase Image Transformations (?width=400&quality=80).
 * Click a panel to select → download full ~1K version or view in lightbox.
 */

import { useState } from 'react'
import { Download, Loader2, ZoomIn, CheckCircle2 } from 'lucide-react'
import { Lightbox } from '@/components/ui/lightbox'
import { PANEL_NAMES_RU } from '@/lib/ai/contact-sheet'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PanelVariant {
  /** 1-based panel number (1=TL, 2=TR, 3=BL, 4=BR) */
  id:           1 | 2 | 3 | 4
  /** Full ~1K public URL */
  url:          string
  /** Thumbnail URL with Supabase Image Transformations (?width=400) */
  thumbUrl:     string
  /** True after Vertex AI upscale (future feature) */
  is_upscaled:  boolean
  /** 4K PNG public URL — set after upscale */
  upscaled_url?: string
}

interface ContactSheetViewerProps {
  generationId: string
  panels:       PanelVariant[]
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function downloadImage(url: string, name: string) {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    const ext  = blob.type === 'image/png' ? 'png' : 'jpg'
    const tmp  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = tmp
    a.download = `${name}.${ext}`
    a.click()
    URL.revokeObjectURL(tmp)
  } catch {
    window.open(url, '_blank')
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactSheetViewer({ generationId, panels }: ContactSheetViewerProps) {
  const [selectedId,  setSelectedId]  = useState<1 | 2 | 3 | 4 | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">

      {/* Label */}
      <div>
        <p className="text-sm font-semibold text-foreground">Выберите ракурс</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Нажмите на понравившийся вариант, чтобы скачать или увеличить
        </p>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {panels.map((panel, idx) => {
          const isSelected = selectedId === panel.id
          return (
            <button
              key={panel.id}
              onClick={() => setSelectedId(isSelected ? null : panel.id)}
              className={`
                relative group w-full aspect-square rounded-xl overflow-hidden
                border-2 transition-all duration-200 focus:outline-none
                ${isSelected
                  ? 'border-rose-gold-400 shadow-glow'
                  : 'border-cream-200 hover:border-rose-gold-200'
                }
              `}
              aria-label={`Вариант ${panel.id}: ${PANEL_NAMES_RU[panel.id as 1|2|3|4]}`}
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={panel.thumbUrl}
                alt={`Вариант ${panel.id} — ${PANEL_NAMES_RU[panel.id as 1|2|3|4]}`}
                className="w-full h-full object-cover"
                loading={idx > 1 ? 'lazy' : 'eager'}
              />

              {/* Hover / selected overlay */}
              <div className={`
                absolute inset-0 transition-all duration-200
                ${isSelected ? 'bg-rose-gold-400/15' : 'bg-black/0 group-hover:bg-black/10'}
              `} />

              {/* Panel name badge */}
              <span className={`
                absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full
                px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm
                ${isSelected ? 'bg-rose-gold-400 text-white' : 'bg-black/40 text-white'}
              `}>
                {panel.id} · {PANEL_NAMES_RU[panel.id as 1|2|3|4]}
              </span>

              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute top-1.5 right-1.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-gold-400 drop-shadow" />
                </span>
              )}

              {/* Expand button (hover) */}
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxSrc(panel.url) }}
                className="absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg shadow opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Открыть полноэкранно"
              >
                <ZoomIn className="w-3 h-3 text-foreground/70" />
              </button>
            </button>
          )
        })}
      </div>

      {/* Download row for selected panel */}
      {selectedId && (
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-xs text-muted-foreground">
            Выбран: <span className="text-foreground font-medium">
              {PANEL_NAMES_RU[selectedId]}
            </span>
          </p>
          <DownloadButton
            url={panels.find((p) => p.id === selectedId)!.url}
            name={`luminify-panel-${selectedId}-${generationId}`}
          />
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        images={lightboxSrc ? [{ url: lightboxSrc }] : []}
        initialIndex={0}
        open={lightboxSrc !== null}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  )
}

// ── Inline download button ────────────────────────────────────────────────────
function DownloadButton({ url, name }: { url: string; name: string }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      onClick={async () => { setBusy(true); await downloadImage(url, name); setBusy(false) }}
      disabled={busy}
      className="flex items-center gap-1.5 bg-white border border-cream-200 hover:border-rose-gold-200 text-foreground text-xs font-semibold px-3 py-2 rounded-xl shadow-soft hover:shadow-card transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
    >
      {busy
        ? <Loader2 className="w-3.5 h-3.5 text-rose-gold-500 animate-spin" />
        : <Download className="w-3.5 h-3.5 text-rose-gold-500" />
      }
      {busy ? 'Загрузка…' : 'Скачать'}
    </button>
  )
}
