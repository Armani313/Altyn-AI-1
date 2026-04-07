import { Line as FabricLine, type Canvas, type Line } from 'fabric'

const SNAP_THRESHOLD = 8
const LINE_COLOR = '#C4834F'

let vLine: Line | null = null
let hLine: Line | null = null

export function initGuidelines(canvas: Canvas) {
  const makeLine = (points: [number, number, number, number]) =>
    new FabricLine(points, {
      stroke: LINE_COLOR,
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      opacity: 0,
    })

  vLine = makeLine([0, 0, 0, canvas.height!])
  hLine = makeLine([0, 0, canvas.width!, 0])
  canvas.add(vLine, hLine)

  canvas.on('object:moving', (e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = e.target as any
    if (!obj || !vLine || !hLine) return

    const cw = canvas.width!
    const ch = canvas.height!
    const cx = cw / 2
    const cy = ch / 2

    const bound = obj.getBoundingRect()
    const objCX = bound.left + bound.width / 2
    const objCY = bound.top + bound.height / 2

    // Snap to vertical center
    if (Math.abs(objCX - cx) < SNAP_THRESHOLD) {
      obj.set('left', cx - bound.width / 2 + (obj.left! - bound.left))
      vLine.set({ x1: cx, y1: 0, x2: cx, y2: ch, opacity: 1 })
    } else {
      vLine.set({ opacity: 0 })
    }

    // Snap to horizontal center
    if (Math.abs(objCY - cy) < SNAP_THRESHOLD) {
      obj.set('top', cy - bound.height / 2 + (obj.top! - bound.top))
      hLine.set({ x1: 0, y1: cy, x2: cw, y2: cy, opacity: 1 })
    } else {
      hLine.set({ opacity: 0 })
    }

    canvas.requestRenderAll()
  })

  canvas.on('object:modified', () => {
    vLine?.set({ opacity: 0 })
    hLine?.set({ opacity: 0 })
    canvas.requestRenderAll()
  })
}

export function updateGuidelineDimensions(canvas: Canvas) {
  if (vLine) {
    vLine.set({ x1: canvas.width! / 2, y1: 0, x2: canvas.width! / 2, y2: canvas.height! })
  }
  if (hLine) {
    hLine.set({ x1: 0, y1: canvas.height! / 2, x2: canvas.width!, y2: canvas.height! / 2 })
  }
}
