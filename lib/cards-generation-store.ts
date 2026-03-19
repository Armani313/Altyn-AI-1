/**
 * CardsGenerationStore — singleton per browser session.
 *
 * Keeps generation running even when the user navigates away from /cards.
 * The component subscribes on mount and unsubscribes on unmount; the store
 * continues fetching and updates sessionStorage so state survives navigation.
 */

import { CUSTOM_CARD_TEMPLATE_ID, AI_FREE_CARD_ID } from './card-templates'

export interface CardResult {
  templateId: string
  status:     'generating' | 'done' | 'error'
  resultUrl:  string | null
  panels:     Array<{ id: number; url: string; thumbUrl?: string }> | null
  error:      string | null
}

export type GenerationParams = {
  templateIds:        string[]
  file:               File
  customFile:         File | null
  aspectRatio:        string
  productName:        string
  brandName:          string
  productDescription: string
}

type Listener = (results: CardResult[], creditsRemaining?: number) => void

const SESSION_KEY = 'cards:results'

class CardsGenerationStore {
  private _results: CardResult[] = []
  private _listeners = new Set<Listener>()
  private _running = false
  // Hold File refs so they survive component unmount during generation
  private _file:       File | null = null
  private _customFile: File | null = null

  get results()  { return this._results }
  get running()  { return this._running }

  /** Restore from sessionStorage. Called once, client-side, on first store creation. */
  hydrate() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as CardResult[]
      // Any 'generating' states mean the tab was closed mid-generation — mark as errors
      this._results = parsed.map((r) =>
        r.status === 'generating'
          ? { ...r, status: 'error' as const, error: 'Генерация была прервана. Попробуйте снова.' }
          : r
      )
      this._persist()
    } catch { /* ignore */ }
  }

  subscribe(fn: Listener): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  private _notify(creditsRemaining?: number) {
    this._listeners.forEach((fn) => fn(this._results, creditsRemaining))
  }

  private _persist() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._results)) } catch { /* ignore */ }
  }

  private _setResult(templateId: string, update: Partial<CardResult>, creditsRemaining?: number) {
    this._results = this._results.map((r) =>
      r.templateId === templateId ? { ...r, ...update } : r
    )
    this._persist()
    this._notify(creditsRemaining)
  }

  clearAll() {
    this._results = []
    this._file       = null
    this._customFile = null
    this._persist()
    this._notify()
  }

  async startGeneration(params: GenerationParams) {
    if (this._running) return

    this._file       = params.file
    this._customFile = params.customFile
    this._running    = true

    this._results = params.templateIds.map((id) => ({
      templateId: id,
      status:     'generating' as const,
      resultUrl:  null,
      panels:     null,
      error:      null,
    }))
    this._persist()
    this._notify()

    await this._runLoop(params.templateIds, params)

    this._running = false
    // Keep _file/_customFile alive for potential retry
  }

  async retryFailed(params: {
    file:               File | null
    customFile:         File | null
    aspectRatio:        string
    productName:        string
    brandName:          string
    productDescription: string
  }) {
    if (this._running) return

    const failedIds = this._results.filter((r) => r.status === 'error').map((r) => r.templateId)
    if (failedIds.length === 0) return

    // Use component's current file, fall back to stored file from last generation
    const file = params.file ?? this._file
    if (!file) return

    this._file       = file
    this._customFile = params.customFile ?? this._customFile
    this._running    = true

    this._results = this._results.map((r) =>
      failedIds.includes(r.templateId) ? { ...r, status: 'generating' as const, panels: null, error: null } : r
    )
    this._persist()
    this._notify()

    await this._runLoop(failedIds, {
      templateIds: failedIds, file,
      customFile:  params.customFile ?? null,
      aspectRatio: params.aspectRatio, productName: params.productName,
      brandName: params.brandName, productDescription: params.productDescription,
    })

    this._running = false
  }

  private async _runLoop(ids: string[], params: GenerationParams) {
    for (let i = 0; i < ids.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 3000))
      const templateId = ids[i]

      try {
        const fd = new FormData()
        fd.append('image',        this._file!)
        fd.append('template_id',  templateId)
        fd.append('aspect_ratio', params.aspectRatio)
        if (params.productName)        fd.append('product_name',        params.productName)
        if (params.brandName)          fd.append('brand_name',          params.brandName)
        if (params.productDescription) fd.append('product_description', params.productDescription)

        const isCustom = templateId === CUSTOM_CARD_TEMPLATE_ID
        if (templateId === AI_FREE_CARD_ID) {
          // Free card — 4 different layout styles via contact-sheet split
          fd.append('generate_mode', 'card-free-contact-sheet')
        } else if (!isCustom) {
          // Regular card template — 4 variations using the template layout
          fd.append('generate_mode', 'contact-sheet')
        }
        console.log(`[CardsStore] templateId="${templateId}" generate_mode=${fd.get('generate_mode') ?? 'none'}`)
        if (templateId === CUSTOM_CARD_TEMPLATE_ID && this._customFile) {
          fd.append('custom_template', this._customFile)
        }

        const res  = await fetch('/api/generate', { method: 'POST', body: fd })
        const data = await res.json() as {
          error?: string
          outputUrl?: string
          creditsRemaining?: number
          isContactSheet?: boolean
          panels?: Array<{ id: number; url: string; thumbUrl?: string }>
        }

        console.log(`[CardsStore] response ok=${res.ok} isContactSheet=${data.isContactSheet} panels=${data.panels?.length ?? 0} outputUrl=${!!data.outputUrl}`)
        if (!res.ok) {
          this._setResult(templateId, {
            status: 'error',
            error:  data.error ?? 'Ошибка генерации. Попробуйте снова.',
          })
        } else if (data.isContactSheet && data.panels?.length) {
          this._setResult(
            templateId,
            { status: 'done', panels: data.panels, resultUrl: data.panels[0]?.url ?? null },
            typeof data.creditsRemaining === 'number' ? data.creditsRemaining : undefined
          )
        } else {
          this._setResult(
            templateId,
            { status: 'done', resultUrl: data.outputUrl ?? null, panels: null },
            typeof data.creditsRemaining === 'number' ? data.creditsRemaining : undefined
          )
        }
      } catch {
        this._setResult(templateId, {
          status: 'error',
          error:  'Ошибка соединения. Проверьте интернет.',
        })
      }
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
let _store: CardsGenerationStore | null = null

/** Returns the singleton store. Safe to call only client-side (from useEffect / handlers). */
export function getCardsStore(): CardsGenerationStore {
  if (!_store) {
    _store = new CardsGenerationStore()
    _store.hydrate()
  }
  return _store
}
