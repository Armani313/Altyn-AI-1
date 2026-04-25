'use client'

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
  Undo2, Redo2, Download, FlipHorizontal2, FlipVertical2,
  Type, Sticker, Layers, SlidersHorizontal, ChevronUp, ChevronDown,
  Sun, Contrast, Droplets, Move3d, Eye, Trash2, Palette,
  AlignLeft, AlignCenter, AlignRight, Paintbrush, ArrowLeft, X,
  MoreHorizontal, ImageIcon, ZoomIn, ZoomOut, Maximize2, Copy,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorHistory } from './use-editor-history'
import { BADGES, type BadgeItem } from './badge-library'
import { BackgroundPanel, DEFAULT_BG_CONFIG, type BgConfig } from './background-panel'
import { updateGuidelineDimensions } from './guidelines'

// ─── Types ────────────────────────────────────────────────────────────────────

type SidePanel = 'background' | 'adjust' | 'text' | 'graphics' | 'layers' | null

interface EditorProps {
  productBlobUrl?: string | null
  onBack?: () => void
}

// Fabric v6 uses `name` for custom identification (no `data` prop).
const PREFIX = {
  bg: '__bg__',
  product: '__product__',
  text: '__text__',
  badge: '__badge__',
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLayerType(obj: any): string | null {
  const n = obj.name ?? ''
  if (n.startsWith(PREFIX.bg)) return 'background'
  if (n.startsWith(PREFIX.product)) return 'product'
  if (n.startsWith(PREFIX.text)) return 'text'
  if (n.startsWith(PREFIX.badge)) return 'badge'
  return null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATIOS = [
  { label: '1:1',  w: 1,  h: 1,  desc: 'Kaspi'    },
  { label: '3:4',  w: 3,  h: 4,  desc: 'WB / Ozon' },
  { label: '2:3',  w: 2,  h: 3,  desc: 'Portrait'  },
  { label: '4:3',  w: 4,  h: 3,  desc: 'Landscape' },
  { label: '9:16', w: 9,  h: 16, desc: 'Stories'   },
  { label: '16:9', w: 16, h: 9,  desc: 'Wide'      },
] as const

const CANVAS_BASE = 720

function getDims(w: number, h: number) {
  if (w >= h) return { cw: CANVAS_BASE, ch: Math.round(CANVAS_BASE * h / w) }
  return { cw: Math.round(CANVAS_BASE * w / h), ch: CANVAS_BASE }
}

const FONTS = [
  'Inter',
  'Playfair Display',
  'Georgia',
  'Arial',
  'Courier New',
]

const SHADOW_DEFAULTS = {
  color: 'rgba(0,0,0,0.35)',
  blur: 15,
  offsetX: 4,
  offsetY: 8,
}

const PANEL_ITEMS: { id: NonNullable<SidePanel>; icon: typeof Paintbrush; labelKey: string }[] = [
  { id: 'background', icon: Paintbrush,        labelKey: 'background' },
  { id: 'adjust',     icon: SlidersHorizontal, labelKey: 'adjust'     },
  { id: 'text',       icon: Type,              labelKey: 'text'       },
  { id: 'graphics',   icon: Sticker,           labelKey: 'graphics'   },
  { id: 'layers',     icon: Layers,            labelKey: 'layers'     },
]

const ZOOM_MIN = 0.25
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1

// ─── Small visual ratio preview ───────────────────────────────────────────────

function RatioPreview({ w, h, active }: { w: number; h: number; active: boolean }) {
  const max = 14
  const dw = w >= h ? max : Math.round(max * w / h)
  const dh = w >= h ? Math.round(max * h / w) : max
  return (
    <span
      aria-hidden
      className={`inline-block rounded-[3px] border-[1.5px] transition-colors ${
        active ? 'border-rose-gold-500 bg-rose-gold-100' : 'border-muted-foreground/40'
      }`}
      style={{ width: dw, height: dh }}
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketplaceEditor({ productBlobUrl, onBack }: EditorProps) {
  const t = useTranslations('editor')

  // Fabric.js refs
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)
  const fabricRef = useRef<import('fabric').Canvas | null>(null)
  const productObjRef = useRef<import('fabric').FabricImage | null>(null)
  const blobProductUrlRef = useRef<string | null>(null)
  const prevDimsRef = useRef<{ cw: number; ch: number } | null>(null)

  // State
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(RATIOS[0])
  const [panel, setPanel] = useState<SidePanel>(null)
  const [currentProductUrl, setCurrentProductUrl] = useState<string | null>(productBlobUrl ?? null)
  const [hasProduct, setHasProduct] = useState(Boolean(productBlobUrl))
  const [canvasReady, setCanvasReady] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showRatioMenu, setShowRatioMenu] = useState(false)

  // Background config
  const [bgConfig, setBgConfig] = useState<BgConfig>(DEFAULT_BG_CONFIG)
  const [, forceUpdate] = useState(0)
  const rerender = useCallback(() => forceUpdate((n) => n + 1), [])

  // Adjustment state (for product layer)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [shadowEnabled, setShadowEnabled] = useState(false)
  const [shadowBlur, setShadowBlur] = useState(SHADOW_DEFAULTS.blur)
  const [shadowOffsetX, setShadowOffsetX] = useState(SHADOW_DEFAULTS.offsetX)
  const [shadowOffsetY, setShadowOffsetY] = useState(SHADOW_DEFAULTS.offsetY)
  const [shadowColor, setShadowColor] = useState(SHADOW_DEFAULTS.color)
  const [opacity, setOpacity] = useState(100)

  // Text state
  const [fontFamily, setFontFamily] = useState('Inter')
  const [textColor, setTextColor] = useState('#1a1a1a')
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center')

  // Mobile: show/hide secondary toolbar actions
  const [showMobileActions, setShowMobileActions] = useState(false)

  // History
  const {
    save: saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorHistory()
  const [, setHistoryTick] = useState(0)

  const saveHistory = useCallback((notify = true) => {
    if (fabricRef.current) {
      saveToHistory(fabricRef.current)
      if (notify) {
        setHistoryTick((n) => n + 1)
      }
    }
  }, [saveToHistory])

  // ── Canvas dimensions ─────────────────────────────────────────────────────
  const { cw, ch } = getDims(ratio.w, ratio.h)

  // Load product into canvas — reads dims from canvas at call time so it's
  // safe to call regardless of ratio changes.
  const loadProductToCanvas = useCallback(async (sourceUrl: string) => {
    const canvas = fabricRef.current
    if (!canvas || !sourceUrl) return

    const fabric = await import('fabric')
    const w = canvas.getWidth()
    const h = canvas.getHeight()

    if (productObjRef.current) {
      canvas.remove(productObjRef.current)
      productObjRef.current = null
    }

    const prodImg = await fabric.FabricImage.fromURL(sourceUrl, { crossOrigin: 'anonymous' })
    const maxDim = Math.min(w, h) * 0.6
    const scale = maxDim / Math.max(prodImg.width ?? 1, prodImg.height ?? 1)
    prodImg.set({
      scaleX: scale,
      scaleY: scale,
      left: w / 2,
      top: h / 2,
      originX: 'center',
      originY: 'center',
      name: PREFIX.product,
    })
    prodImg.setControlsVisibility({ mtr: true })
    canvas.add(prodImg)
    canvas.setActiveObject(prodImg)
    productObjRef.current = prodImg
    setHasProduct(true)
    canvas.requestRenderAll()
    saveHistory()
    rerender()
  }, [rerender, saveHistory])

  // ── Initialize Fabric canvas (RUN ONCE) ───────────────────────────────────
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const fabric = await import('fabric')
      if (!mounted || !canvasElRef.current) return

      const initialDims = getDims(ratio.w, ratio.h)

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: initialDims.cw,
        height: initialDims.ch,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
        allowTouchScrolling: false,
      })

      fabricRef.current = canvas
      prevDimsRef.current = { cw: initialDims.cw, ch: initialDims.ch }

      // Snapping guidelines
      const { initGuidelines } = await import('./guidelines')
      initGuidelines(canvas)

      // Selection event for re-rendering sidebar
      canvas.on('selection:created', rerender)
      canvas.on('selection:updated', rerender)
      canvas.on('selection:cleared', rerender)
      canvas.on('object:modified', () => saveHistory())

      canvas.requestRenderAll()
      saveHistory(false)
      setCanvasReady(true)
    }
    init()

    return () => {
      mounted = false
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
      productObjRef.current = null
      prevDimsRef.current = null
      setCanvasReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── React to ratio change: resize WITHOUT losing layers ───────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !canvasReady) return

    const prev = prevDimsRef.current
    if (!prev || (prev.cw === cw && prev.ch === ch)) return

    // Scale factors per axis
    const sx = cw / prev.cw
    const sy = ch / prev.ch
    // For object (X, Y) preserve aspect ratio with the smaller factor so
    // nothing overflows.
    const s = Math.min(sx, sy)

    canvas.setDimensions({ width: cw, height: ch })

    canvas.getObjects().forEach((obj) => {
      const layerType = getLayerType(obj)
      // Background objects are recreated by the bg effect on dim change.
      if (layerType === 'background') return
      // Skip guideline lines (excludeFromExport=true marker).
      if ((obj as { excludeFromExport?: boolean }).excludeFromExport) return

      const left = obj.left ?? 0
      const top = obj.top ?? 0

      obj.set({
        left: left * sx,
        top: top * sy,
        scaleX: (obj.scaleX ?? 1) * s,
        scaleY: (obj.scaleY ?? 1) * s,
      })
      obj.setCoords()
    })

    updateGuidelineDimensions(canvas)
    prevDimsRef.current = { cw, ch }
    canvas.requestRenderAll()
    saveHistory()
  }, [cw, ch, canvasReady, saveHistory])

  // Sync prop changes to local state
  useEffect(() => {
    setCurrentProductUrl(productBlobUrl ?? null)
    setHasProduct(Boolean(productBlobUrl))
  }, [productBlobUrl])

  // Load / unload product when URL changes (NOT on ratio change)
  useEffect(() => {
    if (!canvasReady) return

    if (!currentProductUrl) {
      if (productObjRef.current && fabricRef.current) {
        fabricRef.current.remove(productObjRef.current)
        productObjRef.current = null
        fabricRef.current.requestRenderAll()
      }
      setHasProduct(false)
      return
    }

    loadProductToCanvas(currentProductUrl)
  }, [canvasReady, currentProductUrl, loadProductToCanvas])

  useEffect(() => () => {
    if (blobProductUrlRef.current) {
      URL.revokeObjectURL(blobProductUrlRef.current)
    }
  }, [])

  // ── Keep Fabric pointer offset in sync with CSS-scaled canvas ─────────────
  useEffect(() => {
    const recalc = () => fabricRef.current?.calcOffset()
    window.addEventListener('resize', recalc)
    window.addEventListener('scroll', recalc, true)
    window.addEventListener('orientationchange', recalc)
    return () => {
      window.removeEventListener('resize', recalc)
      window.removeEventListener('scroll', recalc, true)
      window.removeEventListener('orientationchange', recalc)
    }
  }, [])

  // Recalc offset when zoom changes (CSS scale impacts pointer math)
  useEffect(() => {
    requestAnimationFrame(() => fabricRef.current?.calcOffset())
  }, [zoom, panel])

  // ── Apply background config to canvas ─────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !canvasReady) return

    const applyBg = async () => {
      const fabric = await import('fabric')

      // Remove existing bg objects
      const existing = canvas.getObjects().filter((o) => getLayerType(o) === 'background')
      existing.forEach((o) => canvas.remove(o))

      if (bgConfig.type === 'color') {
        canvas.backgroundColor = bgConfig.color
      } else if (bgConfig.type === 'transparent') {
        canvas.backgroundColor = ''
        const checker = new fabric.Rect({
          width: cw,
          height: ch,
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          name: PREFIX.bg,
          excludeFromExport: true,
          fill: new fabric.Pattern({
            source: (() => {
              const c = document.createElement('canvas')
              c.width = 32; c.height = 32
              const ctx = c.getContext('2d')!
              ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, 16, 16); ctx.fillRect(16, 16, 16, 16)
              ctx.fillStyle = '#ffffff'; ctx.fillRect(16, 0, 16, 16); ctx.fillRect(0, 16, 16, 16)
              return c
            })(),
            repeat: 'repeat',
          }),
        })
        canvas.add(checker)
        canvas.sendObjectToBack(checker)
      } else if (bgConfig.type === 'gradient') {
        canvas.backgroundColor = ''
        const rect = new fabric.Rect({
          width: cw,
          height: ch,
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          name: PREFIX.bg,
          fill: new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: cw, y2: ch },
            colorStops: [
              { offset: 0, color: bgConfig.gradient.from },
              { offset: 1, color: bgConfig.gradient.to },
            ],
          }),
        })
        canvas.add(rect)
        canvas.sendObjectToBack(rect)
      } else if (bgConfig.type === 'image' && bgConfig.imageUrl) {
        canvas.backgroundColor = ''
        const bgImg = await fabric.FabricImage.fromURL(bgConfig.imageUrl, { crossOrigin: 'anonymous' })
        const scaleX = cw / (bgImg.width ?? 1)
        const scaleY = ch / (bgImg.height ?? 1)
        const scale = Math.max(scaleX, scaleY)
        bgImg.set({
          scaleX: scale,
          scaleY: scale,
          left: cw / 2,
          top: ch / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
          name: PREFIX.bg,
        })
        canvas.add(bgImg)
        canvas.sendObjectToBack(bgImg)
      }

      canvas.requestRenderAll()
    }
    applyBg()
  }, [bgConfig, cw, ch, canvasReady])

  // ── Apply filters to product ──────────────────────────────────────────────
  useEffect(() => {
    const obj = productObjRef.current
    if (!obj) return

    const applyFilters = async () => {
      const fabric = await import('fabric')
      const filters: InstanceType<typeof fabric.filters.BaseFilter>[] = []

      if (brightness !== 0) {
        filters.push(new fabric.filters.Brightness({ brightness: brightness / 100 }))
      }
      if (contrast !== 0) {
        filters.push(new fabric.filters.Contrast({ contrast: contrast / 100 }))
      }
      if (saturation !== 0) {
        filters.push(new fabric.filters.Saturation({ saturation: saturation / 100 }))
      }

      obj.filters = filters
      obj.applyFilters()
      fabricRef.current?.requestRenderAll()
    }
    applyFilters()
  }, [brightness, contrast, saturation])

  // ── Apply shadow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const obj = productObjRef.current
    if (!obj) return

    const applyShadow = async () => {
      if (shadowEnabled) {
        const fabric = await import('fabric')
        obj.shadow = new fabric.Shadow({
          color: shadowColor,
          blur: shadowBlur,
          offsetX: shadowOffsetX,
          offsetY: shadowOffsetY,
        })
      } else {
        obj.shadow = null
      }
      fabricRef.current?.requestRenderAll()
    }
    applyShadow()
  }, [shadowEnabled, shadowBlur, shadowOffsetX, shadowOffsetY, shadowColor])

  // ── Apply opacity ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active) {
      active.set('opacity', opacity / 100)
      canvas.requestRenderAll()
    }
  }, [opacity])

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleFlip = (axis: 'x' | 'y') => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj) return
    if (axis === 'x') obj.set('flipX', !obj.flipX)
    else obj.set('flipY', !obj.flipY)
    canvas!.requestRenderAll()
    saveHistory()
  }

  const handleBringForward = () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj) return
    canvas!.bringObjectForward(obj)
    canvas!.requestRenderAll()
    saveHistory()
  }

  const handleSendBackward = () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj) return
    canvas!.sendObjectBackwards(obj)
    canvas!.requestRenderAll()
    saveHistory()
  }

  const handleDelete = () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj || getLayerType(obj) === 'background') return
    const deletedType = getLayerType(obj)
    canvas!.remove(obj)
    canvas!.discardActiveObject()
    canvas!.requestRenderAll()
    if (deletedType === 'product') {
      productObjRef.current = null
      setCurrentProductUrl(null)
      setHasProduct(false)
    }
    saveHistory()
    rerender()
  }

  const handleDuplicate = async () => {
    const canvas = fabricRef.current
    const obj = canvas?.getActiveObject()
    if (!obj || getLayerType(obj) === 'background' || getLayerType(obj) === 'product') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cloned = await (obj as any).clone()
    cloned.set({
      left: (obj.left ?? 0) + 20,
      top: (obj.top ?? 0) + 20,
    })
    canvas!.add(cloned)
    canvas!.setActiveObject(cloned)
    canvas!.requestRenderAll()
    saveHistory()
    rerender()
  }

  const openProductPicker = () => {
    productInputRef.current?.click()
  }

  const handleProductFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    if (blobProductUrlRef.current) {
      URL.revokeObjectURL(blobProductUrlRef.current)
    }

    const nextUrl = URL.createObjectURL(file)
    blobProductUrlRef.current = nextUrl
    setCurrentProductUrl(nextUrl)
    event.target.value = ''
  }

  const handleAddText = async () => {
    const fabric = await import('fabric')
    const canvas = fabricRef.current
    if (!canvas) return

    const text = new fabric.IText(t('defaultText'), {
      fontFamily,
      fontSize: 32,
      fill: textColor,
      textAlign,
      left: cw / 2,
      top: ch / 2,
      originX: 'center',
      originY: 'center',
      name: PREFIX.text,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.requestRenderAll()
    saveHistory()
    rerender()
  }

  const handleAddBadge = async (badge: BadgeItem) => {
    const fabric = await import('fabric')
    const canvas = fabricRef.current
    if (!canvas) return

    const w = badge.shape === 'circle' ? (badge.size ?? 80) : (badge.width ?? 120)
    const h = badge.shape === 'circle' ? (badge.size ?? 80) : (badge.height ?? 40)

    let bg: InstanceType<typeof fabric.Rect> | InstanceType<typeof fabric.Circle>
    if (badge.shape === 'circle') {
      const r = (badge.size ?? 80) / 2
      bg = new fabric.Circle({
        radius: r,
        fill: badge.fill,
        originX: 'center',
        originY: 'center',
      })
    } else {
      bg = new fabric.Rect({
        width: w,
        height: h,
        rx: badge.shape === 'pill' ? h / 2 : (badge.rx ?? 0),
        ry: badge.shape === 'pill' ? h / 2 : (badge.rx ?? 0),
        fill: badge.fill,
        originX: 'center',
        originY: 'center',
      })
    }

    const text = new fabric.IText(badge.text, {
      fontFamily: badge.fontFamily,
      fontSize: badge.fontSize,
      fontWeight: 'bold',
      fill: badge.textColor,
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    })

    const group = new fabric.Group([bg, text], {
      left: cw / 2,
      top: ch * 0.15,
      originX: 'center',
      originY: 'center',
      subTargetCheck: true,
      interactive: true,
    })
    group.set('name', `${PREFIX.badge}${badge.id}`)

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.requestRenderAll()
    saveHistory()
    rerender()
  }

  const handleUndo = async () => {
    if (fabricRef.current) {
      await undo(fabricRef.current)
      setHistoryTick((n) => n + 1)
      rerender()
    }
  }

  const handleRedo = async () => {
    if (fabricRef.current) {
      await redo(fabricRef.current)
      setHistoryTick((n) => n + 1)
      rerender()
    }
  }

  const handleExport = () => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.discardActiveObject()
    canvas.requestRenderAll()

    const multiplier = 2
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier,
      quality: 1,
    })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `luminify-${ratio.label.replace(':', 'x')}-${Date.now()}.png`
    a.click()
  }

  const updateActiveText = useCallback(
    (props: Record<string, unknown>) => {
      const canvas = fabricRef.current
      const obj = canvas?.getActiveObject()
      if (!obj || getLayerType(obj) !== 'text') return
      obj.set(props)
      canvas!.requestRenderAll()
    },
    []
  )

  // Layer list
  const getLayerObjects = () => {
    const canvas = fabricRef.current
    if (!canvas) return []
    return canvas
      .getObjects()
      .filter((o) => getLayerType(o) !== null)
      .reverse()
  }

  // Active object info
  const activeObj = fabricRef.current?.getActiveObject()
  const activeType = activeObj ? getLayerType(activeObj) : null

  const togglePanel = (id: SidePanel) => setPanel(panel === id ? null : id)

  // Zoom helpers
  const clampZoom = (z: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))
  const handleZoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP))
  const handleZoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP))
  const handleZoomReset = () => setZoom(1)

  // ── Panel content (shared between desktop sidebar and mobile sheet) ──────
  const panelContent = (
    <>
      {/* ─── Background panel ─── */}
      {panel === 'background' && (
        <BackgroundPanel config={bgConfig} onChange={setBgConfig} />
      )}

      {/* ─── Adjust panel ─── */}
      {panel === 'adjust' && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('colorCorrection')}
          </p>

          {!activeObj && (
            <p className="text-xs text-muted-foreground bg-cream-100 rounded-lg px-3 py-2">
              {t('noSelection')}
            </p>
          )}

          {/* Brightness */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{t('brightness')}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{brightness}</span>
            </div>
            <input type="range" min={-100} max={100} value={brightness}
              onChange={(e) => setBrightness(+e.target.value)}
              className="w-full h-1.5 rounded-full accent-rose-gold-500 cursor-pointer" />
          </div>

          {/* Contrast */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{t('contrast')}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{contrast}</span>
            </div>
            <input type="range" min={-100} max={100} value={contrast}
              onChange={(e) => setContrast(+e.target.value)}
              className="w-full h-1.5 rounded-full accent-rose-gold-500 cursor-pointer" />
          </div>

          {/* Saturation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{t('saturation')}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{saturation}</span>
            </div>
            <input type="range" min={-100} max={100} value={saturation}
              onChange={(e) => setSaturation(+e.target.value)}
              className="w-full h-1.5 rounded-full accent-rose-gold-500 cursor-pointer" />
          </div>

          <hr className="border-cream-200" />

          {/* Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">{t('opacity')}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{opacity}%</span>
            </div>
            <input type="range" min={0} max={100} value={opacity}
              onChange={(e) => setOpacity(+e.target.value)}
              className="w-full h-1.5 rounded-full accent-rose-gold-500 cursor-pointer" />
          </div>

          <hr className="border-cream-200" />

          {/* Drop shadow */}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('dropShadow')}
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={shadowEnabled}
              onChange={(e) => setShadowEnabled(e.target.checked)}
              className="accent-rose-gold-500 rounded" />
            <span className="text-xs font-medium">{t('enableShadow')}</span>
          </label>

          {shadowEnabled && (
            <div className="space-y-3 pl-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{t('blur')}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{shadowBlur}</span>
                </div>
                <input type="range" min={0} max={60} value={shadowBlur}
                  onChange={(e) => setShadowBlur(+e.target.value)}
                  className="w-full h-1 rounded-full accent-rose-gold-500 cursor-pointer" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">X</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{shadowOffsetX}</span>
                </div>
                <input type="range" min={-40} max={40} value={shadowOffsetX}
                  onChange={(e) => setShadowOffsetX(+e.target.value)}
                  className="w-full h-1 rounded-full accent-rose-gold-500 cursor-pointer" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Y</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{shadowOffsetY}</span>
                </div>
                <input type="range" min={-40} max={40} value={shadowOffsetY}
                  onChange={(e) => setShadowOffsetY(+e.target.value)}
                  className="w-full h-1 rounded-full accent-rose-gold-500 cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <Move3d className="w-3.5 h-3.5 text-muted-foreground" />
                <input type="color" value={shadowColor.startsWith('rgba') ? '#000000' : shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-cream-200" />
                <span className="text-[11px] text-muted-foreground">{t('shadowColor')}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Text panel ─── */}
      {panel === 'text' && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('typography')}
          </p>

          <Button onClick={handleAddText} variant="outline" size="sm"
            className="w-full border-rose-gold-200 text-rose-gold-700 hover:bg-rose-gold-50 gap-2">
            <Type className="w-4 h-4" />
            {t('addText')}
          </Button>

          <div className="space-y-3">
            {/* Font family */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">{t('font')}</span>
              <select value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value)
                  updateActiveText({ fontFamily: e.target.value })
                }}
                className="w-full h-9 rounded-lg border border-cream-300 bg-white px-2 text-xs">
                {FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">{t('color')}</span>
              <div className="flex items-center gap-2">
                <input type="color" value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value)
                    updateActiveText({ fill: e.target.value })
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-cream-200" />
                <span className="text-xs text-muted-foreground">{textColor}</span>
              </div>
            </div>

            {/* Alignment */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">{t('alignment')}</span>
              <div className="flex gap-1">
                {([
                  { val: 'left' as const, icon: AlignLeft },
                  { val: 'center' as const, icon: AlignCenter },
                  { val: 'right' as const, icon: AlignRight },
                ]).map(({ val, icon: Icon }) => (
                  <button key={val}
                    onClick={() => {
                      setTextAlign(val)
                      updateActiveText({ textAlign: val })
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      textAlign === val
                        ? 'bg-rose-gold-100 text-rose-gold-700'
                        : 'bg-cream-100 text-muted-foreground hover:bg-cream-200'
                    }`}>
                    <Icon className="w-4 h-4 mx-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Graphics panel ─── */}
      {panel === 'graphics' && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('badges')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((badge) => (
              <button key={badge.id}
                onClick={() => handleAddBadge(badge)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-cream-200
                           hover:border-rose-gold-200 hover:bg-rose-gold-50/50 transition-all group">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: badge.shape === 'circle' ? 36 : Math.min((badge.width ?? 120) * 0.45, 72),
                    height: badge.shape === 'circle' ? 36 : Math.min((badge.height ?? 40) * 0.45, 20),
                    borderRadius: badge.shape === 'circle' ? '50%'
                      : badge.shape === 'pill' ? 999
                      : (badge.rx ?? 0) * 0.45,
                    backgroundColor: badge.fill,
                    color: badge.textColor,
                    fontFamily: badge.fontFamily,
                    fontSize: Math.max(badge.fontSize * 0.45, 7),
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                >
                  {badge.text}
                </div>
                <span className="text-[10px] text-muted-foreground group-hover:text-foreground">
                  {badge.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ─── Layers panel ─── */}
      {panel === 'layers' && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
            {t('layers')}
          </p>
          <div className="space-y-1">
            {getLayerObjects().map((obj, i) => {
              const isActive = fabricRef.current?.getActiveObject() === obj
              const type = getLayerType(obj)
              const label =
                type === 'background' ? t('layerBackground') :
                type === 'product' ? t('layerProduct') :
                type === 'text' ? (obj as import('fabric').IText).text?.slice(0, 20) || t('layerText') :
                type === 'badge' ? t('layerBadge') :
                `${t('layerObject')} ${i + 1}`

              return (
                <button key={i}
                  onClick={() => {
                    if (type === 'background') return
                    fabricRef.current?.setActiveObject(obj)
                    fabricRef.current?.requestRenderAll()
                    rerender()
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                    isActive
                      ? 'bg-rose-gold-50 text-rose-gold-700 border border-rose-gold-100'
                      : 'hover:bg-cream-100 text-foreground'
                  } ${type === 'background' ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}>
                  <Palette className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
            {getLayerObjects().length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">{t('noLayers')}</p>
            )}
          </div>
        </>
      )}
    </>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6]">
      <input
        ref={productInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProductFileChange}
      />

      {/* ── Top toolbar ── */}
      <header
        className="shrink-0 border-b border-cream-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Row 1: primary actions */}
        <div className="flex items-center gap-1 px-2 lg:px-4 py-2">
          {/* Left cluster */}
          <div className="flex items-center gap-1 shrink-0">
            {onBack && (
              <Button variant="ghost" size="icon" className="w-9 h-9 shrink-0"
                onClick={onBack} title={t('backToUpload')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5 px-2.5 text-xs border-cream-300 hover:border-rose-gold-300 hover:bg-rose-gold-50"
              onClick={openProductPicker}
            >
              <ImageIcon className="w-3.5 h-3.5 text-rose-gold-600" />
              <span className="hidden sm:inline">
                {hasProduct ? t('replaceInEditor') : t('uploadToEditor')}
              </span>
            </Button>
            <div className="w-px h-6 bg-cream-200 mx-1 shrink-0 hidden sm:block" />
            <Button variant="ghost" size="icon" className="w-9 h-9 shrink-0"
              onClick={handleUndo} disabled={!canUndo()} title="Undo">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 shrink-0"
              onClick={handleRedo} disabled={!canRedo()} title="Redo">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Center: Format picker (visual) */}
          <div className="flex-1 flex justify-center min-w-0 px-2">
            <div className="relative">
              <button
                onClick={() => setShowRatioMenu((v) => !v)}
                className="flex items-center gap-2 px-3 h-9 rounded-lg border border-cream-300 bg-white text-xs font-medium hover:border-rose-gold-300 transition-colors"
              >
                <RatioPreview w={ratio.w} h={ratio.h} active />
                <span className="font-semibold">{ratio.label}</span>
                <span className="hidden sm:inline text-muted-foreground">· {ratio.desc}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showRatioMenu ? 'rotate-180' : ''}`} />
              </button>

              {showRatioMenu && (
                <>
                  {/* invisible backdrop to close on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRatioMenu(false)}
                  />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-[260px] z-50 rounded-xl border border-cream-200 bg-white shadow-card p-1.5">
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                      {t('format')}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {RATIOS.map((r) => {
                        const isActive = ratio.label === r.label
                        return (
                          <button
                            key={r.label}
                            onClick={() => {
                              setRatio(r)
                              setShowRatioMenu(false)
                            }}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                              isActive
                                ? 'bg-rose-gold-50 ring-1 ring-rose-gold-200'
                                : 'hover:bg-cream-100'
                            }`}
                          >
                            <RatioPreview w={r.w} h={r.h} active={isActive} />
                            <div className="flex flex-col min-w-0">
                              <span className={`text-xs font-semibold ${isActive ? 'text-rose-gold-700' : 'text-foreground'}`}>
                                {r.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {r.desc}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right cluster: Mobile action toggle + Export */}
          {activeObj && (
            <Button variant="ghost" size="icon" className="w-9 h-9 shrink-0 lg:hidden"
              onClick={() => setShowMobileActions((v) => !v)}
              title={t('actions')}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}

          <Button onClick={handleExport} size="sm"
            className="gradient-rose-gold text-white rounded-lg h-9 px-3 lg:px-4 text-xs gap-1.5 shrink-0 shadow-soft">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('export')}</span>
          </Button>
        </div>

        {/* Row 2: contextual object actions (desktop, when selected) */}
        {activeObj && (
          <div className="hidden lg:flex items-center gap-0.5 px-4 pb-2 -mt-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-2">
              {activeType === 'product' ? t('layerProduct')
                : activeType === 'text' ? t('layerText')
                : activeType === 'badge' ? t('layerBadge')
                : t('actions')}
            </span>
            <Button variant="ghost" size="icon" className="w-8 h-8"
              onClick={() => handleFlip('x')} title={t('flipH')}>
              <FlipHorizontal2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8"
              onClick={() => handleFlip('y')} title={t('flipV')}>
              <FlipVertical2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-cream-200 mx-1" />
            <Button variant="ghost" size="icon" className="w-8 h-8"
              onClick={handleBringForward} title={t('bringForward')}>
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8"
              onClick={handleSendBackward} title={t('sendBackward')}>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {(activeType === 'text' || activeType === 'badge') && (
              <>
                <div className="w-px h-5 bg-cream-200 mx-1" />
                <Button variant="ghost" size="icon" className="w-8 h-8"
                  onClick={handleDuplicate} title={t('duplicate')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </>
            )}
            <div className="w-px h-5 bg-cream-200 mx-1" />
            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete} disabled={activeType === 'background'} title={t('delete')}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Row 2 (mobile-only): Object actions when toggled */}
        {showMobileActions && activeObj && (
          <div className="flex items-center justify-center gap-1 px-2 pb-2 lg:hidden border-t border-cream-100 pt-1.5">
            <Button variant="ghost" size="icon" className="w-9 h-9"
              onClick={() => handleFlip('x')} title={t('flipH')}>
              <FlipHorizontal2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9"
              onClick={() => handleFlip('y')} title={t('flipV')}>
              <FlipVertical2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-cream-200 mx-0.5" />
            <Button variant="ghost" size="icon" className="w-9 h-9"
              onClick={handleBringForward} title={t('bringForward')}>
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9"
              onClick={handleSendBackward} title={t('sendBackward')}>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {(activeType === 'text' || activeType === 'badge') && (
              <>
                <div className="w-px h-5 bg-cream-200 mx-0.5" />
                <Button variant="ghost" size="icon" className="w-9 h-9"
                  onClick={handleDuplicate} title={t('duplicate')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </>
            )}
            <div className="w-px h-5 bg-cream-200 mx-0.5" />
            <Button variant="ghost" size="icon" className="w-9 h-9 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete} disabled={activeType === 'background'} title={t('delete')}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </header>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Desktop: vertical icon strip (lg+) ── */}
        <nav className="hidden lg:flex w-14 flex-shrink-0 bg-white border-r border-cream-200 flex-col items-center py-3 gap-1">
          {PANEL_ITEMS.map(({ id, icon: Icon, labelKey }) => (
            <button key={id}
              onClick={() => togglePanel(id)}
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                panel === id
                  ? 'bg-rose-gold-100 text-rose-gold-700 shadow-soft'
                  : 'text-muted-foreground hover:bg-cream-100 hover:text-foreground'
              }`}
              title={t(labelKey)}>
              <Icon className="w-4 h-4" strokeWidth={panel === id ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium leading-none">{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        {/* ── Desktop: side panel content (lg+) ── */}
        {panel && (
          <aside className="hidden lg:block w-[280px] flex-shrink-0 bg-white border-r border-cream-200 overflow-y-auto p-4 space-y-4">
            {panelContent}
          </aside>
        )}

        {/* ── Canvas area ── */}
        <div
          className="flex-1 flex items-center justify-center overflow-auto p-4 lg:p-8 relative"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {!canvasReady && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('loading')}
            </div>
          )}

          <div className="relative inline-block">
            <canvas
              ref={canvasElRef}
              className="rounded-xl shadow-card ring-1 ring-cream-200/60"
              style={
                zoom === 1
                  ? { maxWidth: '100%', maxHeight: 'calc(100dvh - 200px)', touchAction: 'none' }
                  : { width: cw * zoom, height: ch * zoom, maxWidth: 'none', maxHeight: 'none', touchAction: 'none' }
              }
            />
            {!hasProduct && canvasReady && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-cream-300 bg-white/85 backdrop-blur-sm">
                <div className="max-w-[280px] px-6 text-center">
                  <ImageIcon className="w-10 h-10 mx-auto text-rose-gold-400/70 mb-3" />
                  <p className="text-base font-semibold text-foreground">
                    {t('emptyEditorTitle')}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t('emptyEditorSubtitle')}
                  </p>
                  <Button
                    onClick={openProductPicker}
                    className="mt-4 gradient-rose-gold text-white rounded-xl h-10 px-5"
                  >
                    {t('uploadToEditor')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          {canvasReady && (
            <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 flex items-center gap-0.5 rounded-full bg-white/95 backdrop-blur shadow-card border border-cream-200 px-1 py-1 z-10">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full"
                onClick={handleZoomOut} disabled={zoom <= ZOOM_MIN} title={t('zoomOut')}>
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={handleZoomReset}
                className="text-[11px] font-mono font-medium px-1.5 min-w-[44px] text-center text-muted-foreground hover:text-foreground"
                title={t('zoomFit')}
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full"
                onClick={handleZoomIn} disabled={zoom >= ZOOM_MAX} title={t('zoomIn')}>
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-4 bg-cream-200 mx-0.5" />
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full"
                onClick={handleZoomReset} title={t('zoomFit')}>
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Mobile: backdrop when panel is open ── */}
        {panel && (
          <div
            className="lg:hidden absolute inset-0 z-10 bg-black/30 transition-opacity"
            onClick={() => setPanel(null)}
          />
        )}

        {/* ── Mobile: bottom sheet panel overlay (< lg) ── */}
        {panel && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-20 flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{ maxHeight: '55dvh' }}>
            {/* Handle + close */}
            <div className="relative flex items-center justify-center px-4 pt-2.5 pb-1.5 bg-white rounded-t-2xl border-t border-cream-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
              <div className="w-10 h-1 rounded-full bg-cream-300" />
              <button onClick={() => setPanel(null)}
                className="absolute right-3 top-2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-cream-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white overflow-y-auto p-4 space-y-3 overscroll-contain"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 60px)' }}>
              {panelContent}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: horizontal bottom tool bar (< lg) ── */}
      <nav className="lg:hidden flex items-center justify-around bg-white border-t border-cream-200 shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {PANEL_ITEMS.map(({ id, icon: Icon, labelKey }) => (
          <button key={id}
            onClick={() => togglePanel(id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[48px] min-h-[48px] transition-colors ${
              panel === id
                ? 'text-primary'
                : 'text-muted-foreground active:text-foreground'
            }`}>
            <Icon className="w-5 h-5" strokeWidth={panel === id ? 2.2 : 1.8} />
            <span className={`text-[10px] leading-tight ${panel === id ? 'font-semibold' : 'font-medium'}`}>
              {t(labelKey)}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
