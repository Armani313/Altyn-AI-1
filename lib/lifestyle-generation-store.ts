import { isAiFreeLifestyleId, type ProductType } from '@/lib/constants'
import {
  pollGenerateJob,
  type GenerateJobPollResult,
} from '@/lib/generate/poll-generate-job'
import type { GenerationResult } from '@/components/generate/result-viewer'

type AspectRatio = '1:1' | '9:16'
type LifestylePanel = NonNullable<GenerateJobPollResult['panels']>[number]
export type MarketplaceCopyVariantId = 'short' | 'detailed' | 'bullets'

export interface MarketplaceCopyState {
  status: 'idle' | 'generating' | 'done' | 'error'
  variants: Record<MarketplaceCopyVariantId, string> | null
  error: string | null
}

export interface LifestyleWorkspaceSnapshot {
  previewUrl: string | null
  selectedTemplates: string[]
  aspectRatio: AspectRatio
  userPrompt: string
  results: GenerationResult[]
  marketplaceCopy: MarketplaceCopyState
  running: boolean
}

interface LifestyleMessages {
  generationError: string
  connectionError: string
  insufficientCredits: (needed: number, available: number) => string
}

type Listener = (snapshot: LifestyleWorkspaceSnapshot, creditsRemaining?: number) => void

const MARKETPLACE_COPY_CREDITS = 1

const EMPTY_MARKETPLACE_COPY: MarketplaceCopyState = {
  status: 'idle',
  variants: null,
  error: null,
}

class LifestyleGenerationStore {
  private _snapshot: LifestyleWorkspaceSnapshot = {
    previewUrl: null,
    selectedTemplates: [],
    aspectRatio: '1:1',
    userPrompt: '',
    results: [],
    marketplaceCopy: EMPTY_MARKETPLACE_COPY,
    running: false,
  }

  private _listeners = new Set<Listener>()
  private _file: File | null = null
  private _generationRunId = 0

  get snapshot() {
    return this._snapshot
  }

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn)
    fn(this._snapshot)
    return () => this._listeners.delete(fn)
  }

  private _notify(creditsRemaining?: number) {
    this._listeners.forEach((fn) => fn(this._snapshot, creditsRemaining))
  }

  private _setSnapshot(update: Partial<LifestyleWorkspaceSnapshot>, creditsRemaining?: number) {
    this._snapshot = { ...this._snapshot, ...update }
    this._notify(creditsRemaining)
  }

  setUpload(file: File, previewUrl: string) {
    if (this._snapshot.previewUrl && this._snapshot.previewUrl !== previewUrl) {
      URL.revokeObjectURL(this._snapshot.previewUrl)
    }

    this._file = file
    this._setSnapshot({
      previewUrl,
      results: [],
      marketplaceCopy: EMPTY_MARKETPLACE_COPY,
    })
  }

  clearUpload() {
    if (this._snapshot.previewUrl) {
      URL.revokeObjectURL(this._snapshot.previewUrl)
    }

    this._file = null
    this._generationRunId += 1
    this._setSnapshot({
      previewUrl: null,
      selectedTemplates: [],
      results: [],
      marketplaceCopy: EMPTY_MARKETPLACE_COPY,
      running: false,
    })
  }

  setSelectedTemplates(selectedTemplates: string[]) {
    this._setSnapshot({ selectedTemplates })
  }

  setAspectRatio(aspectRatio: AspectRatio) {
    this._setSnapshot({ aspectRatio })
  }

  setUserPrompt(userPrompt: string) {
    this._setSnapshot({ userPrompt })
  }

  async startGeneration(
    productType: ProductType,
    creditsRemaining: number | null,
    locale: string,
    messages: LifestyleMessages
  ) {
    if (this._snapshot.running || !this._file) return

    const templates = this._snapshot.selectedTemplates.length > 0
      ? this._snapshot.selectedTemplates
      : ['standalone']

    const requiredCredits = templates.length + MARKETPLACE_COPY_CREDITS

    if (creditsRemaining !== null && creditsRemaining < requiredCredits) {
      this._setSnapshot({
        results: templates.flatMap((_, gi) =>
          [1, 2, 3, 4].map((panelId) => ({
            modelId: `g${gi}_p${panelId}`,
            status: 'error' as const,
            resultUrl: null,
            error: messages.insufficientCredits(requiredCredits, creditsRemaining),
          }))
        ),
        marketplaceCopy: {
          status: 'error',
          variants: null,
          error: messages.insufficientCredits(requiredCredits, creditsRemaining),
        },
      })
      return
    }

    const runId = ++this._generationRunId

    this._setSnapshot({
      running: true,
      marketplaceCopy: {
        status: 'generating',
        variants: null,
        error: null,
      },
      results: templates.flatMap((_, gi) =>
        [1, 2, 3, 4].map((panelId) => ({
          modelId: `g${gi}_p${panelId}`,
          status: 'generating' as const,
          resultUrl: null,
          error: null,
        }))
      ),
    })

    const imageTasks = templates.map(async (modelId, gi) => {
      const prefix = `g${gi}`

      try {
        const fd = new FormData()
        fd.append('image', this._file!)
        fd.append('product_type', productType)
        fd.append('contact_sheet_ratio', this._snapshot.aspectRatio)

        if (isAiFreeLifestyleId(modelId)) {
          fd.append('generate_mode', 'lifestyle-free')
        } else {
          fd.append('generate_mode', 'contact-sheet')
          if (modelId !== 'standalone') fd.append('model_id', modelId)
        }

        if (this._snapshot.userPrompt.trim()) {
          fd.append('user_prompt', this._snapshot.userPrompt.trim())
        }

        const res = await fetch('/api/generate', { method: 'POST', body: fd })
        const data = await res.json() as {
          success?: boolean
          generationId?: string
          statusToken?: string
          panels?: LifestylePanel[]
          creditsRemaining?: number
          error?: string
        }

        if (runId !== this._generationRunId) return

        if (res.status === 202 && data.generationId) {
          const finalData = await pollGenerateJob(data.generationId, data.statusToken)
          if (runId !== this._generationRunId) return

          if (finalData.status !== 'completed' || !finalData.panels) {
            this._updatePrefix(prefix, {
              status: 'error',
              error: finalData.error ?? messages.generationError,
            })
            return
          }

          this._applyPanels(prefix, finalData.panels, finalData.creditsRemaining)
          return
        }

        if (!res.ok || !data.success || !data.panels) {
          this._updatePrefix(prefix, {
            status: 'error',
            error: data.error ?? messages.generationError,
          })
          return
        }

        this._applyPanels(prefix, data.panels, data.creditsRemaining)
      } catch {
        if (runId !== this._generationRunId) return
        this._updatePrefix(prefix, {
          status: 'error',
          error: messages.connectionError,
        })
      }
    })

    await Promise.allSettled([
      this._generateMarketplaceCopy(productType, locale, runId, messages),
      ...imageTasks,
    ])

    if (runId === this._generationRunId) {
      this._setSnapshot({ running: false })
    }
  }

  async retryFailed(
    productType: ProductType,
    creditsRemaining: number | null,
    messages: LifestyleMessages
  ) {
    if (this._snapshot.running || !this._file) return

    const failedPrefixes = Array.from(
      new Set(
        this._snapshot.results
          .filter((result) => result.status === 'error')
          .map((result) => result.modelId.split('_p')[0])
      )
    )

    if (failedPrefixes.length === 0) return

    const templates = this._snapshot.selectedTemplates.length > 0
      ? this._snapshot.selectedTemplates
      : ['standalone']

    const retryTemplates = failedPrefixes
      .map((prefix) => {
        const gi = parseInt(prefix.slice(1), 10)
        return templates[gi] ?? null
      })
      .filter(Boolean) as string[]

    if (retryTemplates.length === 0) return

    if (creditsRemaining !== null && creditsRemaining < retryTemplates.length) {
      this._setSnapshot({
        results: this._snapshot.results.map((result) =>
          failedPrefixes.some((prefix) => result.modelId.startsWith(prefix))
            ? {
                ...result,
                error: messages.insufficientCredits(retryTemplates.length, creditsRemaining),
              }
            : result
        ),
      })
      return
    }

    const runId = ++this._generationRunId

    this._setSnapshot({
      running: true,
      results: this._snapshot.results.map((result) =>
        failedPrefixes.some((prefix) => result.modelId.startsWith(prefix))
          ? { ...result, status: 'generating' as const, error: null }
          : result
      ),
    })

    await Promise.allSettled(
      retryTemplates.map(async (modelId, index) => {
        const prefix = failedPrefixes[index]

        try {
          const fd = new FormData()
          fd.append('image', this._file!)
          fd.append('product_type', productType)
          fd.append('contact_sheet_ratio', this._snapshot.aspectRatio)

          if (isAiFreeLifestyleId(modelId)) {
            fd.append('generate_mode', 'lifestyle-free')
          } else {
            fd.append('generate_mode', 'contact-sheet')
            if (modelId !== 'standalone') fd.append('model_id', modelId)
          }

          if (this._snapshot.userPrompt.trim()) {
            fd.append('user_prompt', this._snapshot.userPrompt.trim())
          }

          const res = await fetch('/api/generate', { method: 'POST', body: fd })
          const data = await res.json() as {
            success?: boolean
            generationId?: string
            statusToken?: string
            panels?: LifestylePanel[]
            creditsRemaining?: number
            error?: string
          }

          if (runId !== this._generationRunId) return

          if (res.status === 202 && data.generationId) {
            const finalData = await pollGenerateJob(data.generationId, data.statusToken)
            if (runId !== this._generationRunId) return

            if (finalData.status !== 'completed' || !finalData.panels) {
              this._updatePrefix(prefix, {
                status: 'error',
                error: finalData.error ?? messages.generationError,
              })
              return
            }

            this._applyPanels(prefix, finalData.panels, finalData.creditsRemaining)
            return
          }

          if (!res.ok || !data.success || !data.panels) {
            this._updatePrefix(prefix, {
              status: 'error',
              error: data.error ?? messages.generationError,
            })
            return
          }

          this._applyPanels(prefix, data.panels, data.creditsRemaining)
        } catch {
          if (runId !== this._generationRunId) return
          this._updatePrefix(prefix, {
            status: 'error',
            error: messages.connectionError,
          })
        }
      })
    )

    if (runId === this._generationRunId) {
      this._setSnapshot({ running: false })
    }
  }

  async regenerateMarketplaceCopy(
    productType: ProductType,
    creditsRemaining: number | null,
    locale: string,
    messages: LifestyleMessages
  ) {
    if (this._snapshot.running || !this._file) return

    if (creditsRemaining !== null && creditsRemaining < MARKETPLACE_COPY_CREDITS) {
      this._setSnapshot({
        marketplaceCopy: {
          status: 'error',
          variants: this._snapshot.marketplaceCopy.variants,
          error: messages.insufficientCredits(MARKETPLACE_COPY_CREDITS, creditsRemaining),
        },
      })
      return
    }

    const runId = ++this._generationRunId
    this._setSnapshot({
      marketplaceCopy: {
        status: 'generating',
        variants: this._snapshot.marketplaceCopy.variants,
        error: null,
      },
    })

    await this._generateMarketplaceCopy(productType, locale, runId, messages)
  }

  private async _generateMarketplaceCopy(
    productType: ProductType,
    locale: string,
    runId: number,
    messages: LifestyleMessages
  ) {
    if (!this._file) return

    try {
      const fd = new FormData()
      fd.append('image', this._file)
      fd.append('product_type', productType)
      fd.append('locale', locale === 'en' ? 'en' : 'ru')

      if (this._snapshot.userPrompt.trim()) {
        fd.append('user_prompt', this._snapshot.userPrompt.trim())
      }

      const res = await fetch('/api/product-copy', { method: 'POST', body: fd })
      const data = await res.json() as {
        success?: boolean
        copy?: Record<MarketplaceCopyVariantId, string>
        creditsRemaining?: number
        error?: string
      }

      if (runId !== this._generationRunId) return

      if (!res.ok || !data.success || !data.copy) {
        this._setSnapshot({
          marketplaceCopy: {
            status: 'error',
            variants: this._snapshot.marketplaceCopy.variants,
            error: data.error ?? messages.generationError,
          },
        })
        return
      }

      this._setSnapshot({
        marketplaceCopy: {
          status: 'done',
          variants: {
            short: data.copy.short ?? '',
            detailed: data.copy.detailed ?? '',
            bullets: data.copy.bullets ?? '',
          },
          error: null,
        },
      }, data.creditsRemaining)
    } catch {
      if (runId !== this._generationRunId) return
      this._setSnapshot({
        marketplaceCopy: {
          status: 'error',
          variants: this._snapshot.marketplaceCopy.variants,
          error: messages.connectionError,
        },
      })
    }
  }

  private _applyPanels(
    prefix: string,
    panels: LifestylePanel[],
    creditsRemaining?: number
  ) {
    const nextResults = this._snapshot.results.map((result) => {
      if (!result.modelId.startsWith(prefix)) return result
      const panelId = parseInt(result.modelId.split('_p')[1], 10)
      const panel = panels.find((item) => item.id === panelId)
      return panel
        ? { ...result, status: 'done' as const, resultUrl: panel.url, error: null }
        : result
    })

    this._setSnapshot({ results: nextResults }, creditsRemaining)
  }

  private _updatePrefix(prefix: string, update: Partial<GenerationResult>) {
    const nextResults = this._snapshot.results.map((result) =>
      result.modelId.startsWith(prefix)
        ? { ...result, ...update }
        : result
    )
    this._setSnapshot({ results: nextResults })
  }
}

const lifestyleStores = new Map<ProductType, LifestyleGenerationStore>()

export function getLifestyleGenerationStore(productType: ProductType) {
  if (!lifestyleStores.has(productType)) {
    lifestyleStores.set(productType, new LifestyleGenerationStore())
  }

  return lifestyleStores.get(productType)!
}
