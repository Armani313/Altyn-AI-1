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
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

function openInNewTab(url: string): void {
  const w = window.open(url, '_blank', 'noopener,noreferrer')
  if (!w) window.location.href = url
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
  if (isIOS()) {
    openInNewTab(url)
    return
  }

  const fallbackExt = kind === 'video' ? 'mp4' : 'jpg'

  try {
    const res = await fetch(url, { credentials: 'omit' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const filename = `${name}.${extFor(blob, fallbackExt)}`
    triggerBlobDownload(blob, filename)
  } catch {
    if (isAndroid()) {
      openInNewTab(url)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }
}
