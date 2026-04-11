import type { VideoGenerationStatus } from '@/types/database.types'

export interface VideoTemplateListItem {
  id: string
  name: string
  description: string | null
  coverImageUrl: string
  demoVideoUrl: string
  aspectRatio: '9:16'
  label: string | null
  premium: boolean
}

export interface VideoGenerationPollResponse {
  generationId: string
  status: VideoGenerationStatus
  outputVideoUrl: string | null
  posterUrl: string | null
  creditsRemaining: number | null
  error: string | null
}
