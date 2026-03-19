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

  const halfW = Math.floor(width  / 2)
  const halfH = Math.floor(height / 2)

  const regions: { id: 1 | 2 | 3 | 4; left: number; top: number }[] = [
    { id: 1, left: 0,     top: 0     },  // top-left
    { id: 2, left: halfW, top: 0     },  // top-right
    { id: 3, left: 0,     top: halfH },  // bottom-left
    { id: 4, left: halfW, top: halfH },  // bottom-right
  ]

  const panels = await Promise.all(
    regions.map(async ({ id, left, top }) => {
      const buffer = await sharp(imageBuffer)
        .extract({ left, top, width: halfW, height: halfH })
        .jpeg({ quality: 92, progressive: true })
        .toBuffer()

      return { id, buffer, width: halfW, height: halfH } satisfies SplitPanel
    })
  )

  return panels
}
