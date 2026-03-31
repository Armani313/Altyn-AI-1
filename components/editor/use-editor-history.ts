import { useRef, useCallback } from 'react'
import type { Canvas } from 'fabric'

const MAX_HISTORY = 15

export function useEditorHistory() {
  const historyRef = useRef<string[]>([])
  const indexRef = useRef(-1)
  const lockRef = useRef(false)

  const save = useCallback((canvas: Canvas) => {
    if (lockRef.current) return
    const json = JSON.stringify(canvas.toJSON())
    const idx = indexRef.current

    // Trim future states
    historyRef.current = historyRef.current.slice(0, idx + 1)
    historyRef.current.push(json)

    // Cap history
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    }
    indexRef.current = historyRef.current.length - 1
  }, [])

  const restore = useCallback(async (canvas: Canvas, idx: number) => {
    const json = historyRef.current[idx]
    if (!json) return
    lockRef.current = true
    await canvas.loadFromJSON(json)
    canvas.requestRenderAll()
    indexRef.current = idx
    lockRef.current = false
  }, [])

  const undo = useCallback(async (canvas: Canvas) => {
    if (indexRef.current <= 0) return
    await restore(canvas, indexRef.current - 1)
  }, [restore])

  const redo = useCallback(async (canvas: Canvas) => {
    if (indexRef.current >= historyRef.current.length - 1) return
    await restore(canvas, indexRef.current + 1)
  }, [restore])

  const canUndo = useCallback(() => indexRef.current > 0, [])
  const canRedo = useCallback(
    () => indexRef.current < historyRef.current.length - 1,
    []
  )

  return { save, undo, redo, canUndo, canRedo }
}
