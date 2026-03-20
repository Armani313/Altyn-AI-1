import path from 'path'

const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Webpack: prevent Node.js-only packages from being bundled ────────────
  // @imgly/background-removal depends on onnxruntime-web (browser) not
  // onnxruntime-node. Without these aliases webpack throws "Can't resolve" errors.
  webpack: (config, { webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$':            false,
      'onnxruntime-node$': false,
      // Force CJS builds of onnxruntime-web instead of the ESM bundles.
      // Root cause: ort.bundle.min.mjs / ort.webgpu.bundle.min.mjs have 4 uses of
      // `import.meta.url` which webpack compiles to `new __webpack_require__.U(…)`.
      // __webpack_require__.U is NOT a URL constructor → TypeError at runtime.
      // The CJS builds (ort.min.js / ort.webgpu.min.js) have 0 import.meta.url usages.
      // These aliases handle the module-name lookup (resolve.alias).
      'onnxruntime-web$':        path.resolve('./node_modules/onnxruntime-web/dist/ort.min.js'),
      'onnxruntime-web/webgpu$': path.resolve('./node_modules/onnxruntime-web/dist/ort.webgpu.min.js'),
    }

    // Belt-and-suspenders: NormalModuleReplacementPlugin catches any remaining
    // references to the ESM bundle files (e.g. when onnxruntime-web@1.21.0's
    // package.json `"import"` condition bypasses resolve.alias for dynamic imports
    // inside lazy chunks such as @imgly/background-removal).
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /onnxruntime-web[/\\]dist[/\\]ort\.bundle\.min\.mjs$/,
        path.resolve('./node_modules/onnxruntime-web/dist/ort.min.js'),
      ),
      new webpack.NormalModuleReplacementPlugin(
        /onnxruntime-web[/\\]dist[/\\]ort\.webgpu\.bundle\.min\.mjs$/,
        path.resolve('./node_modules/onnxruntime-web/dist/ort.webgpu.min.js'),
      ),
    )

    // Suppress "Critical dependency: require function is used in a way in which
    // dependencies cannot be statically extracted" warnings from onnxruntime-web.
    // These are harmless — ORT uses try/require for optional backends internally.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /onnxruntime-web/ },
    ]

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
        // Applied to ALL routes — non-CSP security headers.
        // CSP is in the next entry (excluded from /remove-bg which needs its own).
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
      {
        // MED-1: Content-Security-Policy — applied to all routes EXCEPT /remove-bg.
        // /remove-bg needs 'unsafe-eval' for ONNX Runtime; if we set the global CSP here
        // AND a /remove-bg CSP below, the browser enforces BOTH (most-restrictive union),
        // which blocks 'unsafe-eval' even on /remove-bg. Excluding it here allows the
        // /remove-bg-specific CSP (with 'unsafe-eval') to be the only one for that page.
        source: '/((?!remove-bg).*)',
        headers: [
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-eval' is needed by webpack HMR / React Refresh in dev only
              // blob: needed for ONNX Runtime — it injects its worker via a blob: script URL
          isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com"
                : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              // Supabase storage for generated images; Google Analytics tracking pixel
              "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
              // Google Fonts (if ever added)
              "font-src 'self' https://fonts.gstatic.com",
              // Supabase API + realtime; ONNX Runtime WASM CDN; Google Analytics
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://staticimgly.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://region1.google-analytics.com",
              // Replaces X-Frame-Options — more expressive
              // Allow blob: workers — ONNX Runtime creates thread workers via blob URLs
              // when running in a Web Worker context (even in single-thread mode as fallback)
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
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
        // COOP + COEP + CSP override for /remove-bg:
        // 1. COOP/COEP unlocks SharedArrayBuffer → multi-threaded WASM inference.
        // 2. CSP adds 'unsafe-eval' — onnxruntime-web CJS build uses new Function()
        //    internally for dynamic code generation (WebGL/WASM glue). The global
        //    CSP only allows 'wasm-unsafe-eval' which is not enough for JS eval.
        //    Scoped to /remove-bg only to minimise attack surface on other pages.
        source: '/remove-bg',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy',  value: 'credentialless' },
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://staticimgly.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
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
