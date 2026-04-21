'use client'

import { GoogleAnalytics } from '@next/third-parties/google'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

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

  return (
    <>
      <Script id="ga-disable-signals" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('set', 'allow_google_signals', false);
gtag('set', 'allow_ad_personalization_signals', false);`}
      </Script>
      <GoogleAnalytics gaId={gaId} />
    </>
  )
}
