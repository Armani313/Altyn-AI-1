const EXT_FROM_MIME: Record<string, string> = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4':  'mp4',
}

function extFor(blob: Blob, fallback: string): string {
  return EXT_FROM_MIME[blob.type] ?? fallback
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
}

async function tryWebShare(blob: Blob, filename: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
    share?:    (data: ShareData) => Promise<void>
  }
  if (!nav.share || !nav.canShare) return false

  try {
    const file = new File([blob], filename, { type: blob.type })
    const data: ShareData = { files: [file] }
    if (!nav.canShare(data)) return false
    await nav.share(data)
    return true
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return true
    return false
  }
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = href
  a.download = filename
  a.rel      = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 10_000)
}

export async function downloadMedia(
  url: string,
  name: string,
  kind: 'image' | 'video' = 'image',
): Promise<void> {
  const fallbackExt = kind === 'video' ? 'mp4' : 'jpg'

  try {
    const res  = await fetch(url, { credentials: 'omit' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const filename = `${name}.${extFor(blob, fallbackExt)}`

    const shared = await tryWebShare(blob, filename)
    if (shared) return

    triggerBlobDownload(blob, filename)
  } catch {
    if (isIOS()) {
      window.location.href = url
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }
}
