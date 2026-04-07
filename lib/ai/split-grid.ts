/**
 * split-grid.ts
 *
 * Splits a 2×2 contact-sheet image (any size) into 4 equal-quadrant buffers
 * using sharp. Ordering: [top-left, top-right, bottom-left, bottom-right].
 */

import sharp from 'sharp'

export interface SplitPanel {
  /** 1-based panel number matching panel_variants.id */
  id:     1 | 2 | 3 | 4
  buffer: Buffer
  /** Width of the split panel in pixels */
  width:  number
  /** Height of the split panel in pixels */
  height: number
}

const MIN_GUTTER_PX = 8
const MAX_GUTTER_PX = 24

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function deriveGutter(size: number) {
  return clamp(Math.round(size * 0.008), MIN_GUTTER_PX, MAX_GUTTER_PX)
}

function fitRatioInside(width: number, height: number, ratio: number) {
  let fittedWidth = width
  let fittedHeight = Math.round(width / ratio)

  if (fittedHeight > height) {
    fittedHeight = height
    fittedWidth = Math.round(height * ratio)
  }

  return {
    width: Math.min(width, fittedWidth),
    height: Math.min(height, fittedHeight),
  }
}

/**
 * Splits an image buffer into 4 quadrant buffers.
 * Outputs JPEG at quality 92 (≈1K per panel when input is 2K).
 */
export async function splitContactSheet(imageBuffer: Buffer): Promise<SplitPanel[]> {
  const image    = sharp(imageBuffer)
  const meta     = await image.metadata()
  const width    = meta.width
  const height   = meta.height

  if (!width || !height) {
    throw new Error('split-grid: could not read image dimensions')
  }

  const midX = Math.floor(width / 2)
  const midY = Math.floor(height / 2)

  // Gemini is instructed to draw a white divider between panels.
  // Crop a small safety gutter around the center so the stored panels do not
  // contain white stripes or slivers from neighboring quadrants.
  const gutterX = deriveGutter(width)
  const gutterY = deriveGutter(height)

  const leftWidth = midX - gutterX
  const rightLeft = midX + gutterX
  const rightWidth = width - rightLeft
  const topHeight = midY - gutterY
  const bottomTop = midY + gutterY
  const bottomHeight = height - bottomTop
  const targetRatio = width / height

  if (leftWidth <= 0 || rightWidth <= 0 || topHeight <= 0 || bottomHeight <= 0) {
    throw new Error('split-grid: invalid contact sheet crop dimensions')
  }

  const regions: { id: 1 | 2 | 3 | 4; left: number; top: number; width: number; height: number }[] = [
    { id: 1, left: 0,         top: 0,         width: leftWidth,  height: topHeight    },
    { id: 2, left: rightLeft, top: 0,         width: rightWidth, height: topHeight    },
    { id: 3, left: 0,         top: bottomTop, width: leftWidth,  height: bottomHeight },
    { id: 4, left: rightLeft, top: bottomTop, width: rightWidth, height: bottomHeight },
  ]

  const panels = await Promise.all(
    regions.map(async ({ id, left, top, width: cropWidth, height: cropHeight }) => {
      const fitted = fitRatioInside(cropWidth, cropHeight, targetRatio)
      const cropLeft = left + Math.floor((cropWidth - fitted.width) / 2)
      const cropTop = top + Math.floor((cropHeight - fitted.height) / 2)

      const buffer = await sharp(imageBuffer)
        .extract({ left: cropLeft, top: cropTop, width: fitted.width, height: fitted.height })
        .jpeg({ quality: 92, progressive: true })
        .toBuffer()

      return { id, buffer, width: fitted.width, height: fitted.height } satisfies SplitPanel
    })
  )

  return panels
}
