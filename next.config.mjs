const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Docker: generate a self-contained server in .next/standalone ─────────
  // The Dockerfile's runner stage copies only this folder + .next/static.
  output: 'standalone',

  // ── Cloudflare proxy: real visitor IP ────────────────────────────────────
  // Next.js App Router automatically exposes all request headers including
  // CF-Connecting-IP (set by Cloudflare with the real visitor IP).
  // No additional config required — API routes read it via request.headers.get('cf-connecting-ip').

  // ── Security & cache headers ─────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // MED-2: HSTS — force HTTPS for 2 years (Cloudflare also enforces this,
          // but the header ensures it even if Cloudflare is bypassed)
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // MED-1: Content-Security-Policy
          // 'unsafe-inline' for scripts/styles is required by Next.js + framer-motion.
          // Upgrade to nonce-based CSP when time allows.
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' is needed by webpack HMR / React Refresh in dev only
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // Supabase storage + Replicate CDN for generated images
              "img-src 'self' data: blob: https://*.supabase.co https://replicate.delivery https://*.replicate.delivery",
              // Google Fonts (if ever added)
              "font-src 'self' https://fonts.gstatic.com",
              // Supabase API + realtime
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              // Replaces X-Frame-Options — more expressive
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
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
      {
        // Next.js static chunks — content-hashed filenames, safe to cache forever.
        // Cloudflare will also cache these at the edge automatically.
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ── Supabase Storage image domains ───────────────────────────────────────
  // Allow next/image (if ever used) to optimize images from Supabase Storage.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
