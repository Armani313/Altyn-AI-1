'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MarketplaceEditor } from '@/components/editor/marketplace-editor'
import { UploadPhase } from '@/components/editor/upload-phase'

type Phase = 'upload' | 'edit'

export function EditorPageClient() {
  const searchParams = useSearchParams()

  // Backward compat: if ?product= is passed, skip to edit phase
  const initialProduct = searchParams.get('product') || null
  const initialPhase: Phase = initialProduct ? 'edit' : 'upload'

  const [phase, setPhase] = useState<Phase>(initialPhase)
  const [productBlobUrl, setProductBlobUrl] = useState<string | null>(initialProduct)

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
        <UploadPhase onComplete={handleUploadComplete} />
      )}
      {phase === 'edit' && productBlobUrl && (
        <MarketplaceEditor
          productBlobUrl={productBlobUrl}
          onBack={handleBack}
        />
      )}
    </div>
  )
}
