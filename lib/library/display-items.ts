import type { Generation, VideoGeneration } from '@/types/database.types'
import { readPanelVariantsFromMetadata } from '@/lib/generate/panel-variants'

export type LibraryImageGeneration = Pick<
  Generation,
  'id' | 'status' | 'output_image_url' | 'created_at' | 'metadata'
>

export type LibraryVideoGeneration = Pick<
  VideoGeneration,
  'id' | 'status' | 'input_image_url' | 'output_video_url' | 'created_at' | 'metadata'
> & {
  posterUrl?: string | null
}

export interface LibraryPendingItem {
  id: string
  mediaType: 'image' | 'video'
}

export interface LibraryDisplayItem {
  id: string
  generationId: string
  status: Generation['status'] | VideoGeneration['status']
  createdAt: string
  mediaType: 'image' | 'video'
  previewUrl: string | null
  imageUrl: string | null
  videoUrl: string | null
  panelId?: number
}

export interface LibraryDisplayCard extends LibraryDisplayItem {
  dateShort: string
  lightboxLabel: string
}

export interface LibraryGenerationSummary {
  processingCount: number
  failedWithoutImageCount: number
  pendingItems: LibraryPendingItem[]
}

export function buildLibraryDisplayItems(
  imageGenerations: LibraryImageGeneration[],
  videoGenerations: LibraryVideoGeneration[]
): LibraryDisplayItem[] {
  const items: LibraryDisplayItem[] = []

  for (const generation of imageGenerations) {
    const panels = readPanelVariantsFromMetadata(generation.metadata)

    if (generation.status === 'completed' && panels.length > 0) {
      for (const panel of panels) {
        const finalUrl = panel.upscaled_url ?? panel.url
        items.push({
          id: `${generation.id}-panel-${panel.id}`,
          generationId: generation.id,
          status: generation.status,
          createdAt: generation.created_at,
          mediaType: 'image',
          imageUrl: finalUrl,
          videoUrl: null,
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
      mediaType: 'image',
      imageUrl: generation.output_image_url,
      videoUrl: null,
      previewUrl: generation.output_image_url,
    })
  }

  for (const generation of videoGenerations) {
    items.push({
      id: `video-${generation.id}`,
      generationId: generation.id,
      status: generation.status,
      createdAt: generation.created_at,
      mediaType: 'video',
      imageUrl: null,
      videoUrl: generation.output_video_url,
      previewUrl: generation.posterUrl ?? null,
    })
  }

  return items.filter((item) => Boolean(item.previewUrl || item.imageUrl || item.videoUrl))
}

export function summarizeLibraryGenerations(
  imageGenerations: LibraryImageGeneration[],
  videoGenerations: LibraryVideoGeneration[]
): LibraryGenerationSummary {
  let processingCount = 0
  let failedWithoutImageCount = 0
  const pendingItems: LibraryPendingItem[] = []

  for (const generation of imageGenerations) {
    const panels = readPanelVariantsFromMetadata(generation.metadata)
    const hasVisibleImage = Boolean(generation.output_image_url) || panels.length > 0

    if (generation.status === 'pending' || generation.status === 'processing') {
      processingCount += 1
      pendingItems.push({ id: generation.id, mediaType: 'image' })
      continue
    }

    if (generation.status === 'failed' && !hasVisibleImage) {
      failedWithoutImageCount += 1
    }
  }

  for (const generation of videoGenerations) {
    const hasVisiblePreview = Boolean(generation.posterUrl || generation.output_video_url)

    if (generation.status === 'queued' || generation.status === 'processing') {
      processingCount += 1
      pendingItems.push({ id: generation.id, mediaType: 'video' })
      continue
    }

    if (generation.status === 'failed' && !hasVisiblePreview) {
      failedWithoutImageCount += 1
    }
  }

  return {
    processingCount,
    failedWithoutImageCount,
    pendingItems,
  }
}
