'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type ModelStatus = 'loading' | 'ready' | 'error'

const IMGLY_PUBLIC_PATH = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/'

export function useBgRemoval() {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')
  const [modelProgress, setModelProgress] = useState(0)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const runningRef = useRef(false)
  const warmupDone = useRef(false)
  const resultUrlRef = useRef<string | null>(null)

  // NOTE: we intentionally do NOT revoke resultBlobUrl on unmount.
  // The URL is passed to the parent (EditorPageClient) and consumed
  // by MarketplaceEditor after this component unmounts.

  // Eager model warm-up
  useEffect(() => {
    if (warmupDone.current) return
    warmupDone.current = true

    const warmup = async () => {
      let downloadComplete = false
      try {
        const { removeBackground } = await import('@imgly/background-removal')

        // 64×64 solid white canvas — small but valid for the ONNX model
        const canvas = document.createElement('canvas')
        canvas.width = 64; canvas.height = 64
        const ctx = canvas.getContext('2d')
        if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 64, 64) }
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png')
        })

        await removeBackground(blob, {
          publicPath: IMGLY_PUBLIC_PATH,
          model: 'isnet',
          output: { format: 'image/png' },
          progress: (key: string, current: number, total: number) => {
            if (key.startsWith('fetch:') && total > 0) {
              setModelProgress(Math.round((current / total) * 100))
              if (current >= total && !downloadComplete) {
                downloadComplete = true
                setModelStatus('ready')
              }
            }
          },
        })
        setModelStatus('ready')
      } catch {
        if (downloadComplete) setModelStatus('ready')
        else setModelStatus('error')
      }
    }

    warmup()
  }, [])

  const removeBg = useCallback(async (file: File) => {
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
      const { removeBackground } = await import('@imgly/background-removal')

      const resultBlob = await removeBackground(file, {
        publicPath: IMGLY_PUBLIC_PATH,
        proxyToWorker: true,
        model: 'isnet',
        output: { format: 'image/png', quality: 1.0 },
        progress: (key: string, current: number, total: number) => {
          if (total > 0) setProgress(Math.round((current / total) * 100))
          setProgressLabel(key)
        },
      })

      const url = URL.createObjectURL(resultBlob)
      resultUrlRef.current = url
      setResultBlobUrl(url)
      setProgress(100)
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    } finally {
      setIsProcessing(false)
      runningRef.current = false
    }
  }, [])

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
