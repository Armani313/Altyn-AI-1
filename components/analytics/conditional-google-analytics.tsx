'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { usePathname } from 'next/navigation'

const ONNX_PAGES = new Set([
  '/editor',
  '/remove-bg',
  '/tools/background-remover',
  '/tools/white-background',
  '/tools/blur-background',
  '/tools/change-background-color',
  '/tools/add-background',
])

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/^\/(?:ru|en)(?=\/|$)/, '')
  return normalized === '' ? '/' : normalized
}

export function ConditionalGoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname()

  if (ONNX_PAGES.has(normalizePathname(pathname))) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
