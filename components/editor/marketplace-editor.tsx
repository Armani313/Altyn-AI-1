'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Undo2, Redo2, Download, FlipHorizontal2, FlipVertical2,
  Type, Sticker, Layers, SlidersHorizontal, ChevronUp, ChevronDown,
  Sun, Contrast, Droplets, Move3d, Eye, Trash2, Palette,
  AlignLeft, AlignCenter, AlignRight, Paintbrush, ArrowLeft, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorHistory } from './use-editor-history'
import { BADGES, type BadgeItem } from './badge-library'
import { BackgroundPanel, DEFAULT_BG_CONFIG, type BgConfig } from './background-panel'

// ─── Types ────────────────────────────────────────────────────────────────────

type SidePanel = 'background' | 'adjust' | 'text' | 'graphics' | 'layers' | null

interface EditorProps {
  productBlobUrl: string
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

// ─── Component ────────────────────────────────────────────────────────────────

export function MarketplaceEditor({ productBlobUrl, onBack }: EditorProps) {
  const t = useTranslations('editor')

  // Fabric.js refs
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<import('fabric').Canvas | null>(null)
  const productObjRef = useRef<import('fabric').FabricImage | null>(null)

  // State
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(RATIOS[0])
  const [panel, setPanel] = useState<SidePanel>(null)

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

  // History
  const history = useEditorHistory()
  const [historyTick, setHistoryTick] = useState(0)

  const saveHistory = useCallback(() => {
    if (fabricRef.current) {
      history.save(fabricRef.current)
      setHistoryTick((n) => n + 1)
    }
  }, [history])

  // ── Canvas dimensions ─────────────────────────────────────────────────────
  const { cw, ch } = getDims(ratio.w, ratio.h)

  // ── Initialize Fabric canvas ──────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const fabric = await import('fabric')
      if (!mounted || !canvasElRef.current) return

      // Dispose previous
      if (fabricRef.current) {
        fabricRef.current.dispose()
      }

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: cw,
        height: ch,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true,
        allowTouchScrolling: false,
      })

      fabricRef.current = canvas

      // Snapping guidelines
      const { initGuidelines } = await import('./guidelines')
      initGuidelines(canvas)

      // Selection event for re-rendering sidebar
      canvas.on('selection:created', rerender)
      canvas.on('selection:updated', rerender)
      canvas.on('selection:cleared', rerender)
      canvas.on('object:modified', saveHistory)

      // Load product
      if (productBlobUrl) {
        const prodImg = await fabric.FabricImage.fromURL(productBlobUrl, { crossOrigin: 'anonymous' })
        const maxDim = Math.min(cw, ch) * 0.6
        const scale = maxDim / Math.max(prodImg.width ?? 1, prodImg.height ?? 1)
        prodImg.set({
          scaleX: scale,
          scaleY: scale,
          left: cw / 2,
          top: ch / 2,
          originX: 'center',
          originY: 'center',
          name: PREFIX.product,
        })
        prodImg.setControlsVisibility({ mtr: true })
        canvas.add(prodImg)
        canvas.setActiveObject(prodImg)
        productObjRef.current = prodImg
      }

      canvas.requestRenderAll()
      saveHistory()
    }
    init()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cw, ch, productBlobUrl])

  // ── Apply background config to canvas ─────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

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
  }, [bgConfig, cw, ch])

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
    canvas!.remove(obj)
    canvas!.discardActiveObject()
    canvas!.requestRenderAll()
    saveHistory()
    rerender()
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
    ;(group as any).name = `${PREFIX.badge}${badge.id}`

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.requestRenderAll()
    saveHistory()
    rerender()
  }

  const handleUndo = async () => {
    if (fabricRef.current) {
      await history.undo(fabricRef.current)
      setHistoryTick((n) => n + 1)
      rerender()
    }
  }

  const handleRedo = async () => {
    if (fabricRef.current) {
      await history.redo(fabricRef.current)
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
    <div className="flex flex-col h-full">
      {/* ── Top toolbar ── */}
      <div className="flex items-center justify-between px-2 lg:px-4 py-2 lg:py-2.5 border-b border-cream-200 bg-white shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <div className="flex items-center gap-0.5 lg:gap-1 overflow-x-auto scrollbar-hide">
          {/* Back button */}
          {onBack && (
            <>
              <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
                onClick={onBack} title={t('backToUpload')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-cream-200 mx-1 shrink-0" />
            </>
          )}
          {/* Undo / Redo */}
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
            onClick={handleUndo} disabled={!history.canUndo()}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
            onClick={handleRedo} disabled={!history.canRedo()}>
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-cream-200 mx-1 shrink-0" />

          {/* Flip */}
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
            onClick={() => handleFlip('x')} disabled={!activeObj}
            title={t('flipH')}>
            <FlipHorizontal2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
            onClick={() => handleFlip('y')} disabled={!activeObj}
            title={t('flipV')}>
            <FlipVertical2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-cream-200 mx-1 shrink-0" />

          {/* Layer order */}
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
            onClick={handleBringForward} disabled={!activeObj}
            title={t('bringForward')}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"
            onClick={handleSendBackward} disabled={!activeObj}
            title={t('sendBackward')}>
            <ChevronDown className="w-4 h-4" />
          </Button>

          <div className="w-px h-5 bg-cream-200 mx-1 shrink-0" />

          {/* Delete */}
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete} disabled={!activeObj || activeType === 'background'}
            title={t('delete')}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Ratio presets — horizontal scroll on mobile, flex on desktop */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide ml-2 shrink-0">
          {RATIOS.map((r) => (
            <button key={r.label}
              onClick={() => setRatio(r)}
              className={`px-2 lg:px-2.5 py-1 rounded-lg text-[11px] lg:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                ratio.label === r.label
                  ? 'bg-rose-gold-100 text-rose-gold-700 border border-rose-gold-200'
                  : 'text-muted-foreground hover:bg-cream-100'
              }`}>
              {r.label}
              <span className="hidden lg:inline text-[10px] text-muted-foreground ml-1">{r.desc}</span>
            </button>
          ))}
        </div>

        {/* Export */}
        <Button onClick={handleExport} size="sm"
          className="gradient-rose-gold text-white rounded-lg h-8 px-2.5 lg:px-3 text-xs gap-1 lg:gap-1.5 ml-2 shrink-0">
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('export')}</span>
        </Button>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Desktop: vertical icon strip (lg+) ── */}
        <div className="hidden lg:flex w-12 flex-shrink-0 bg-white border-r border-cream-200 flex-col items-center py-3 gap-1">
          {PANEL_ITEMS.map(({ id, icon: Icon, labelKey }) => (
            <button key={id}
              onClick={() => togglePanel(id)}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                panel === id
                  ? 'bg-rose-gold-100 text-rose-gold-700'
                  : 'text-muted-foreground hover:bg-cream-100 hover:text-foreground'
              }`}
              title={t(labelKey)}>
              <Icon className="w-4 h-4" />
              <span className="text-[8px] font-medium leading-none">{t(labelKey)}</span>
            </button>
          ))}
        </div>

        {/* ── Desktop: side panel content (lg+) ── */}
        {panel && (
          <div className="hidden lg:block w-[260px] flex-shrink-0 bg-white border-r border-cream-200 overflow-y-auto p-4 space-y-4">
            {panelContent}
          </div>
        )}

        {/* ── Canvas area ── */}
        <div className="flex-1 flex items-center justify-center bg-[#FAF9F6] overflow-auto p-2 lg:p-4"
          style={{ touchAction: 'none' }}>
          <div className="relative">
            <canvas
              ref={canvasElRef}
              className="rounded-xl shadow-card"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100dvh - 160px)',
              }}
            />
          </div>
        </div>

        {/* ── Mobile: bottom sheet panel overlay (< lg) ── */}
        {panel && (
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-20 flex flex-col"
            style={{ maxHeight: '55vh' }}>
            {/* Drag handle + close */}
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 bg-white rounded-t-2xl border-t border-cream-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
              <div className="w-8 h-1 rounded-full bg-cream-300 mx-auto" />
              <button onClick={() => setPanel(null)} className="absolute right-3 top-2.5 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-cream-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white overflow-y-auto p-4 space-y-4 overscroll-contain"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
              {panelContent}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: horizontal bottom tool bar (< lg) ── */}
      <div className="lg:hidden flex items-center justify-around bg-white border-t border-cream-200 shrink-0"
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
      </div>
    </div>
  )
}
