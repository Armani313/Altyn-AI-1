import createNextIntlPlugin from 'next-intl/plugin'

const isDev = process.env.NODE_ENV === 'development'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  // ── Docker: generate a self-contained server in .next/standalone ─────────
  // The Dockerfile's runner stage copies only this folder + .next/static.
  output: 'standalone',

  // sharp is used by /api/tools/topaz-image for image metadata/conversion.
  // Mark it external so the standalone build copies the native binary correctly.
  serverExternalPackages: ['sharp'],

  // ── Cloudflare proxy: real visitor IP ────────────────────────────────────
  // Next.js App Router automatically exposes all request headers including
  // CF-Connecting-IP (set by Cloudflare with the real visitor IP).
  // No additional config required — API routes read it via request.headers.get('cf-connecting-ip').

  // ── Security & cache headers ─────────────────────────────────────────────
  async headers() {
    const headers = [
      {
        // Applied to ALL routes — non-CSP security headers.
        // CSP is set in proxy.ts.
        source: '/(.*)',
        headers: [
          // MED-2: HSTS — force HTTPS for 2 years (Cloudflare also enforces this,
          // but the header ensures it even if Cloudflare is bypassed)
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Send minimal referrer info cross-origin
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          // Restrict browser feature access
          {
            key:   'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // LOW-6: X-XSS-Protection removed — deprecated in all modern browsers
          // and can cause issues in some older ones. CSP above replaces it.
        ],
      },
    ]

    if (!isDev) {
      headers.splice(2, 0, {
        // Next.js static chunks — content-hashed filenames, safe to cache forever.
        // Apply only in production. In dev this breaks Turbopack/HMR and can cause
        // stale client bundles, hydration mismatches, and missing module factories.
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      })
    }

    return headers
  },

  // ── Image optimizer disabled ──────────────────────────────────────────────
  // Images render without the /_next/image optimizer. Keeping this disabled
  // eliminates the /_next/image DoS attack surface
  // (CVE-2025-59471 / GHSA-9g9p-9gw9-jx7f).
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
