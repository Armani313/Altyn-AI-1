'use client'

import { useRef, useState, useCallback } from 'react'
import { Camera, X, ImagePlus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_MB } from '@/lib/constants'

interface UploadZoneProps {
  onUpload: (file: File, previewUrl: string) => void
  onRemove: () => void
  previewUrl: string | null
}

const ACCEPTED_TYPES = ACCEPTED_IMAGE_TYPES
const MAX_SIZE_MB = MAX_IMAGE_MB

export function UploadZone({ onUpload, onRemove, previewUrl }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const processFile = useCallback(
    (file: File) => {
      setError('')

      if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
        setError('Поддерживаются форматы: JPG, PNG, WEBP, HEIC')
        return
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Максимальный размер файла — ${MAX_SIZE_MB} МБ`)
        return
      }

      const url = URL.createObjectURL(file)
      onUpload(file, url)
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // ── Preview state ────────────────────────────────────────────
  if (previewUrl) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-cream-200 shadow-card aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Загруженное фото украшения"
          className="w-full h-full object-cover"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <Button
            onClick={onRemove}
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-foreground border-0 shadow-card"
          >
            <X className="w-4 h-4 mr-1.5" />
            Удалить
          </Button>
        </div>

        {/* Remove badge */}
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Удалить фото"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Status chip */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-foreground px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-soft">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Фото загружено
        </div>
      </div>
    )
  }

  // ── Empty state ──────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center
          aspect-[4/3] sm:aspect-square rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-300 select-none touch-manipulation
          ${isDragging
            ? 'border-primary bg-rose-gold-50 scale-[1.01] shadow-glow'
            : 'border-cream-300 bg-white hover:border-rose-gold-300 hover:bg-rose-gold-50/40'
          }
        `}
      >
        {/* Background pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03] rounded-2xl"
          style={{
            backgroundImage: 'radial-gradient(circle, #C4834F 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4 p-6 sm:p-8 text-center">
          {/* Icon */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
              isDragging ? 'bg-rose-gold-200' : 'bg-rose-gold-100'
            }`}
          >
            {isDragging ? (
              <ImagePlus className="w-7 h-7 text-rose-gold-600" />
            ) : (
              <Camera className="w-7 h-7 text-rose-gold-500" />
            )}
          </div>

          {/* Text — device-aware copy */}
          <div>
            <p className="font-medium text-foreground mb-1">
              {isDragging
                ? 'Отпустите файл здесь'
                : (
                  <>
                    <span className="hidden sm:inline">Перетащите фото украшения</span>
                    <span className="sm:hidden">Нажмите, чтобы загрузить фото</span>
                  </>
                )
              }
            </p>
            <p className="text-sm text-muted-foreground hidden sm:block">
              или{' '}
              <span className="text-primary font-medium underline underline-offset-2">
                выберите файл
              </span>
            </p>
          </div>

          {/* Format hint */}
          <p className="text-xs text-muted-foreground bg-cream-100 rounded-lg px-3 py-1.5">
            JPG, PNG, WEBP, HEIC · до {MAX_SIZE_MB} МБ
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          onChange={handleChange}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
