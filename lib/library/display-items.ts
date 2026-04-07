import type { Generation } from '@/types/database.types'
import { readPanelVariantsFromMetadata } from '@/lib/generate/panel-variants'

export type LibraryGeneration = Pick<
  Generation,
  'id' | 'status' | 'output_image_url' | 'created_at' | 'metadata'
>

export interface LibraryDisplayItem {
  id: string
  generationId: string
  status: Generation['status']
  createdAt: string
  imageUrl: string | null
  previewUrl: string | null
  panelId?: number
}

export interface LibraryDisplayCard extends LibraryDisplayItem {
  dateShort: string
  lightboxLabel: string
}

export interface LibraryGenerationSummary {
  processingCount: number
  failedWithoutImageCount: number
  pendingGenerationIds: string[]
}

export function buildLibraryDisplayItems(
  generations: LibraryGeneration[]
): LibraryDisplayItem[] {
  const items: LibraryDisplayItem[] = []

  for (const generation of generations) {
    const panels = readPanelVariantsFromMetadata(generation.metadata)

    if (generation.status === 'completed' && panels.length > 0) {
      for (const panel of panels) {
        const finalUrl = panel.upscaled_url ?? panel.url
        items.push({
          id: `${generation.id}-panel-${panel.id}`,
          generationId: generation.id,
          status: generation.status,
          createdAt: generation.created_at,
          imageUrl: finalUrl,
          previewUrl: panel.upscaled_url ?? panel.thumbUrl ?? panel.url,
          panelId: panel.id,
        })
      }
      continue
    }

    items.push({
      id: generation.id,
      generationId: generation.id,
      status: generation.status,
      createdAt: generation.created_at,
      imageUrl: generation.output_image_url,
      previewUrl: generation.output_image_url,
    })
  }

  return items.filter((item) => Boolean(item.previewUrl || item.imageUrl))
}

export function summarizeLibraryGenerations(
  generations: LibraryGeneration[]
): LibraryGenerationSummary {
  let processingCount = 0
  let failedWithoutImageCount = 0
  const pendingGenerationIds: string[] = []

  for (const generation of generations) {
    const panels = readPanelVariantsFromMetadata(generation.metadata)
    const hasVisibleImage = Boolean(generation.output_image_url) || panels.length > 0

    if (generation.status === 'pending' || generation.status === 'processing') {
      processingCount += 1
      pendingGenerationIds.push(generation.id)
      continue
    }

    if (generation.status === 'failed' && !hasVisibleImage) {
      failedWithoutImageCount += 1
    }
  }

  return {
    processingCount,
    failedWithoutImageCount,
    pendingGenerationIds,
  }
}
