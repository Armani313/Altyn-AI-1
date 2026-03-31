'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Upload, Scissors, Loader2, CheckCircle2, WifiOff,
  ArrowRight, RefreshCw, SkipForward,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBgRemoval } from './use-bg-removal'

interface UploadPhaseProps {
  onComplete: (productBlobUrl: string) => void
}

export function UploadPhase({ onComplete }: UploadPhaseProps) {
  const t = useTranslations('editor')
  const bgRemoval = useBgRemoval()

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrlRef = useRef<string | null>(null)

  // NOTE: we intentionally do NOT revoke previewUrl on unmount.
  // If user clicks "Skip", the URL is passed to MarketplaceEditor
  // which loads it after this component unmounts.

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(f)
    previewUrlRef.current = url
    setFile(f)
    setPreviewUrl(url)
    bgRemoval.reset()
  }, [bgRemoval])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleRemoveBg = () => {
    if (file) bgRemoval.removeBg(file)
  }

  const handleContinue = () => {
    if (bgRemoval.resultBlobUrl) {
      onComplete(bgRemoval.resultBlobUrl)
    }
  }

  const handleSkip = () => {
    if (previewUrl) {
      onComplete(previewUrl)
    }
  }

  const isDone = !!bgRemoval.resultBlobUrl
  const canProcess = !!file && !bgRemoval.isProcessing && bgRemoval.modelStatus === 'ready'

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-2xl font-medium text-foreground">
            {t('uploadTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('uploadSubtitle')}
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-rose-gold-400 bg-rose-gold-50/60'
              : file
                ? 'border-cream-300 p-3'
                : 'border-cream-300 hover:border-rose-gold-300 hover:bg-cream-50 p-10'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !file && document.getElementById('editor-upload')?.click()}
        >
          <input
            id="editor-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {file && previewUrl ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="w-20 h-20 object-contain rounded-xl border border-cream-200 bg-white"
              />
              {/* Result preview */}
              {bgRemoval.resultBlobUrl && (
                <>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bgRemoval.resultBlobUrl}
                    alt=""
                    className="w-20 h-20 object-contain rounded-xl border border-cream-200"
                    style={{
                      backgroundImage: 'repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%)',
                      backgroundSize: '12px 12px',
                    }}
                  />
                </>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); document.getElementById('editor-upload')?.click() }}
                  className="text-xs text-primary hover:text-rose-gold-600 flex items-center gap-1 mt-0.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  {t('replace')}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center pointer-events-none">
              <Upload className="w-10 h-10 text-rose-gold-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">{t('uploadProduct')}</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, HEIC</p>
            </div>
          )}
        </div>

        {/* Model status */}
        {bgRemoval.modelStatus === 'loading' && (
          <div className="bg-cream-100 rounded-xl p-3 border border-cream-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-rose-gold-500 animate-spin" />
                <span className="text-xs font-medium">{t('loadingModel')}</span>
              </div>
              <span className="text-xs text-muted-foreground">{bgRemoval.modelProgress}%</span>
            </div>
            <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500 rounded-full transition-all duration-300"
                style={{ width: `${bgRemoval.modelProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{t('loadedOnce')}</p>
          </div>
        )}

        {bgRemoval.modelStatus === 'ready' && !isDone && file && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-100 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700">{t('modelReady')}</span>
          </div>
        )}

        {bgRemoval.modelStatus === 'error' && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-700">{t('modelError')}</span>
          </div>
        )}

        {/* Processing progress */}
        {bgRemoval.isProcessing && (
          <div className="bg-cream-100 rounded-xl p-3 border border-cream-200">
            <p className="text-xs font-medium mb-1.5">
              {t('removingBg')} <span className="text-muted-foreground">{bgRemoval.progress}%</span>
            </p>
            <div className="h-1.5 bg-cream-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-gold-400 to-rose-gold-500 rounded-full transition-all duration-300"
                style={{ width: `${bgRemoval.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {bgRemoval.error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-xs text-red-700">{bgRemoval.error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!isDone ? (
            <>
              <Button
                onClick={handleRemoveBg}
                disabled={!canProcess}
                className="w-full gradient-rose-gold text-white rounded-xl h-11 font-medium gap-2"
              >
                {bgRemoval.isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t('processing')}</>
                ) : (
                  <><Scissors className="w-4 h-4" /> {t('removeBgAction')}</>
                )}
              </Button>

              {file && !bgRemoval.isProcessing && (
                <button
                  onClick={handleSkip}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  {t('skipBgRemoval')}
                </button>
              )}
            </>
          ) : (
            <Button
              onClick={handleContinue}
              className="w-full gradient-rose-gold text-white rounded-xl h-11 font-medium gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              {t('continueToEditor')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
