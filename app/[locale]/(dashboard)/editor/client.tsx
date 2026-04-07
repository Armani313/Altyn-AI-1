'use client'

import { useEffect, useState } from 'react'
import { MarketplaceEditor } from '@/components/editor/marketplace-editor'
import { UploadPhase } from '@/components/editor/upload-phase'

type Phase = 'upload' | 'edit'
type EditorEntryMode = 'remove-bg' | 'photo-editor'

interface EditorPageClientProps {
  initialProduct: string | null
  entryMode: EditorEntryMode
}

export function EditorPageClient({
  initialProduct,
  entryMode,
}: EditorPageClientProps) {
  const initialPhase: Phase = initialProduct ? 'edit' : 'upload'

  const [phase, setPhase] = useState<Phase>(initialPhase)
  const [productBlobUrl, setProductBlobUrl] = useState<string | null>(initialProduct)
  const [resolvedEntryMode, setResolvedEntryMode] = useState<EditorEntryMode>(entryMode)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const photoMode = params.get('mode') === 'photo-editor' || params.get('direct') === '1'
    setResolvedEntryMode(photoMode ? 'photo-editor' : 'remove-bg')
  }, [])

  const handleUploadComplete = (url: string) => {
    setProductBlobUrl(url)
    setPhase('edit')
  }

  const handleBack = () => {
    setPhase('upload')
    setProductBlobUrl(null)
  }

  return (
    <div className={
      phase === 'edit'
        ? 'fixed inset-0 z-[60] bg-[#FAF9F6] flex flex-col lg:relative lg:z-auto lg:h-screen'
        : 'h-[calc(100vh-56px)] lg:h-screen flex flex-col'
    }>
      {phase === 'upload' && (
        <UploadPhase
          key={resolvedEntryMode}
          onComplete={handleUploadComplete}
          mode={resolvedEntryMode}
        />
      )}
      {phase === 'edit' && productBlobUrl && (
        <MarketplaceEditor
          productBlobUrl={productBlobUrl}
          onBack={handleBack}
        />
      )}
      {phase === 'edit' && !productBlobUrl && (
        <MarketplaceEditor
          productBlobUrl={null}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
