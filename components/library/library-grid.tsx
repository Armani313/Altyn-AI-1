'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Maximize2, Calendar, ImageIcon, Clapperboard, Play } from 'lucide-react'
import { Lightbox, type LightboxImage } from '@/components/ui/lightbox'
import { useRouter } from '@/i18n/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { saveUpscaleSourceImage } from '@/lib/tools/upscale-transfer'
import type { LibraryDisplayCard } from '@/lib/library/display-items'
import { downloadMedia } from '@/lib/download-media'

const STATUS_CLASSES: Record<LibraryDisplayCard['status'], string> = {
  queued:     'bg-amber-50 text-amber-600 border-amber-200',
  pending:    'bg-amber-50 text-amber-600 border-amber-200',
  processing: 'bg-blue-50 text-blue-600 border-blue-200',
  completed:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  failed:     'bg-red-50 text-red-600 border-red-200',
}

interface LibraryGridProps {
  items: LibraryDisplayCard[]
}

export function LibraryGrid({ items }: LibraryGridProps) {
  const t = useTranslations('libraryGrid')
  const tLightbox = useTranslations('lightbox')
  const router = useRouter()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [videoDialogItem, setVideoDialogItem] = useState<LibraryDisplayCard | null>(null)

  const STATUS_MAP: Record<LibraryDisplayCard['status'], { label: string; class: string }> = {
    queued:     { label: t('statusQueued'),     class: STATUS_CLASSES.queued     },
    pending:    { label: t('statusPending'),    class: STATUS_CLASSES.pending    },
    processing: { label: t('statusProcessing'), class: STATUS_CLASSES.processing },
    completed:  { label: t('statusCompleted'),  class: STATUS_CLASSES.completed  },
    failed:     { label: t('statusFailed'),     class: STATUS_CLASSES.failed     },
  }

  const lightboxImages: LightboxImage[] = items
    .filter((item) => item.mediaType === 'image' && item.status === 'completed' && item.imageUrl)
    .map((item) => ({
      url: item.imageUrl!,
      label: item.lightboxLabel,
    }))

  function toLightboxIndex(url: string | null): number {
    return url ? lightboxImages.findIndex((img) => img.url === url) : -1
  }

  const handleEnhanceImage = (image: LightboxImage) => {
    setLightboxIndex(null)
    saveUpscaleSourceImage(image.url)
    router.push(`/tools/photo-enhancer?image=${encodeURIComponent(image.url)}`)
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => {
          const status = STATUS_MAP[item.status]
          const lbIndex = toLightboxIndex(item.imageUrl)
          const canExpand = item.mediaType === 'image' && item.status === 'completed' && item.imageUrl && lbIndex >= 0
          const canPlayVideo = item.mediaType === 'video' && item.status === 'completed' && item.videoUrl

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-soft hover:shadow-card hover:border-rose-gold-100 transition-all duration-300"
            >
              {/* Image area */}
              <div className="aspect-square bg-gradient-to-br from-cream-100 to-rose-gold-50 flex items-center justify-center relative overflow-hidden">
                {item.previewUrl ? (
                  canExpand ? (
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(lbIndex)}
                      className="group h-full w-full text-left"
                      aria-label={t('expandFullscreen')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={t('imageAlt')}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </button>
                  ) : canPlayVideo ? (
                    <button
                      type="button"
                      onClick={() => setVideoDialogItem(item)}
                      className="group relative h-full w-full text-left"
                      aria-label={t('openVideo')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt={t('videoAlt')}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
                          <Play className="ml-0.5 h-5 w-5 fill-current" />
                        </span>
                      </div>
                    </button>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.mediaType === 'video' ? t('videoAlt') : t('imageAlt')}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-3">
                    <div className="w-10 h-10 rounded-xl bg-cream-200 flex items-center justify-center">
                      {item.mediaType === 'video' ? (
                        <Clapperboard className="w-5 h-5 text-muted-foreground/50" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {item.status === 'processing' || item.status === 'queued'
                        ? t('generating')
                        : item.mediaType === 'video'
                          ? t('noVideo')
                          : t('noImage')}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer: status + date + action buttons */}
              <div className="p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${status.class}`}>
                    {status.label}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px]">{item.dateShort}</span>
                  </div>
                </div>

                {/* Action buttons — always visible */}
                {(item.imageUrl || item.videoUrl) && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => downloadMedia(
                        item.mediaType === 'video' ? item.videoUrl! : item.imageUrl!,
                        item.mediaType === 'video'
                          ? `luminify-video-${item.generationId.slice(0, 8)}`
                          : item.panelId
                            ? `luminify-${item.generationId.slice(0, 8)}-panel-${item.panelId}`
                            : `luminify-${item.generationId.slice(0, 8)}`,
                        item.mediaType === 'video' ? 'video' : 'image'
                      )}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-cream-100 hover:bg-rose-gold-50 hover:text-rose-gold-700 text-foreground/70 text-[10px] font-semibold py-3 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                      aria-label={t('download')}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('download')}
                    </button>

                    {canExpand && (
                      <button
                        onClick={() => setLightboxIndex(lbIndex)}
                        className="w-10 h-10 flex items-center justify-center bg-cream-100 hover:bg-rose-gold-50 hover:text-rose-gold-700 text-foreground/70 rounded-lg transition-colors touch-manipulation"
                        aria-label={t('expandFullscreen')}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canPlayVideo && (
                      <button
                        onClick={() => setVideoDialogItem(item)}
                        className="w-10 h-10 flex items-center justify-center bg-cream-100 hover:bg-rose-gold-50 hover:text-rose-gold-700 text-foreground/70 rounded-lg transition-colors touch-manipulation"
                        aria-label={t('openVideo')}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Lightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        primaryActionLabel={tLightbox('enhance')}
        onPrimaryAction={handleEnhanceImage}
      />

      <Dialog open={videoDialogItem !== null} onOpenChange={(open) => { if (!open) setVideoDialogItem(null) }}>
        <DialogContent className="max-w-4xl border-cream-200 bg-white p-3 sm:p-4">
          <DialogHeader className="pr-10">
            <DialogTitle className="text-left text-base">
              {t('videoPreviewTitle')}
            </DialogTitle>
          </DialogHeader>

          {videoDialogItem?.videoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-cream-200 bg-black">
              <video
                src={videoDialogItem.videoUrl}
                poster={videoDialogItem.previewUrl ?? undefined}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
