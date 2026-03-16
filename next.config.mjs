const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Webpack: prevent Node.js-only packages from being bundled ────────────
  // @imgly/background-removal depends on onnxruntime-web (browser) not
  // onnxruntime-node. Without these aliases webpack throws "Can't resolve" errors.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$':            false,
      'onnxruntime-node$': false,
    }

    // @imgly/background-removal bundles ONNX Runtime as ESM (.mjs) files that
    // use `import.meta`. Without this rule webpack/Terser treats them as
    // CommonJS and throws "'import.meta' cannot be used outside of module code".
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    })

    return config
  },

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
              // blob: needed for ONNX Runtime — it injects its worker via a blob: script URL
          isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:"
                : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline'",
              // Supabase storage for generated images (Gemini returns bytes, no external CDN needed)
              "img-src 'self' data: blob: https://*.supabase.co",
              // Google Fonts (if ever added)
              "font-src 'self' https://fonts.gstatic.com",
              // Supabase API + realtime; HuggingFace for RMBG-1.4 model download (bg-editor)
              // Supabase + @imgly/background-removal model/WASM CDN
              // blob: needed — ONNX Runtime workers fetch WASM via blob URLs internally
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://staticimgly.com",
              // Replaces X-Frame-Options — more expressive
              // Allow blob: workers — ONNX Runtime creates thread workers via blob URLs
              // when running in a Web Worker context (even in single-thread mode as fallback)
              "worker-src 'self' blob:",
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
      {
        // COOP + COEP for /remove-bg — unlocks SharedArrayBuffer in the browser,
        // enabling multi-threaded WASM inference (significantly faster on CPU).
        // Applied only to this route so other pages are not affected by COEP
        // cross-origin restrictions on embedded resources.
        source: '/remove-bg',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',  value: 'credentialless' },
        ],
      },
    ]
  },

  // ── Image optimizer disabled ──────────────────────────────────────────────
  // next/image is not used in this project (all images are plain <img> tags).
  // Disabling the optimizer eliminates the /_next/image DoS attack surface
  // (CVE-2025-59471 / GHSA-9g9p-9gw9-jx7f).
  images: {
    unoptimized: true,
  },
}

export default nextConfig
