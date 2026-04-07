import type { Json } from '@/types/database.types'

export interface StoredPanelVariant {
  id: number
  url: string
  thumbUrl?: string
  is_upscaled?: boolean
  upscaled_url?: string
}

type MetadataRecord = Record<string, Json | undefined>

export function readMetadataObject(value: Json | undefined): MetadataRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as MetadataRecord
}

export function readPanelVariantsFromMetadata(value: Json | undefined): StoredPanelVariant[] {
  const metadata = readMetadataObject(value)
  const rawPanels = metadata.panel_variants
  if (!Array.isArray(rawPanels)) return []

  const panels: StoredPanelVariant[] = []

  for (const item of rawPanels) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const panel = item as {
      id?: Json
      url?: Json
      thumbUrl?: Json
      is_upscaled?: Json
      upscaled_url?: Json
    }
    const id = typeof panel.id === 'number' ? panel.id : null
    const url = typeof panel.url === 'string' ? panel.url : null
    if (!id || !url) continue

    panels.push({
      id,
      url,
      thumbUrl: typeof panel.thumbUrl === 'string' ? panel.thumbUrl : undefined,
      is_upscaled: typeof panel.is_upscaled === 'boolean' ? panel.is_upscaled : undefined,
      upscaled_url: typeof panel.upscaled_url === 'string' ? panel.upscaled_url : undefined,
    })
  }

  return panels
}

export function writePanelVariantsToMetadata(
  metadataValue: Json | undefined,
  panelVariants: StoredPanelVariant[]
): MetadataRecord {
  const metadata = readMetadataObject(metadataValue)
  return {
    ...metadata,
    panel_variants: panelVariants as unknown as Json,
  }
}
