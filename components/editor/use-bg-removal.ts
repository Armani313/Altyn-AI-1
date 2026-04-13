'use client'

import { useState, useRef, useCallback } from 'react'

type ModelStatus = 'loading' | 'ready' | 'error'

export function useBgRemoval(enabled = true) {
  const [modelStatus] = useState<ModelStatus>('ready')
  const [modelProgress] = useState(100)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const runningRef = useRef(false)
  const resultUrlRef = useRef<string | null>(null)

  // NOTE: we intentionally do NOT revoke resultBlobUrl on unmount.
  // The URL is passed to the parent (EditorPageClient) and consumed
  // by MarketplaceEditor after this component unmounts.

  const removeBg = useCallback(async (file: File) => {
    if (!enabled) return
    if (runningRef.current) return
    runningRef.current = true
    setIsProcessing(true)
    setProgress(0)
    setError('')

    // Revoke previous result
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
      setResultBlobUrl(null)
    }

    try {
      setProgressLabel('upload')
      setProgress(10)

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/tools/remove-bg', {
        method: 'POST',
        body: formData,
      })

      setProgress(80)
      setProgressLabel('processing')

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? `Ошибка сервера (${response.status})`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      resultUrlRef.current = url
      setResultBlobUrl(url)
      setProgress(100)
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    } finally {
      setIsProcessing(false)
      runningRef.current = false
    }
  }, [enabled])

  const reset = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
    }
    setResultBlobUrl(null)
    setProgress(0)
    setProgressLabel('')
    setError('')
    setIsProcessing(false)
  }, [])

  return {
    modelStatus,
    modelProgress,
    isProcessing,
    progress,
    progressLabel,
    resultBlobUrl,
    error,
    removeBg,
    reset,
  }
}
