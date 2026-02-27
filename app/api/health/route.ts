/**
 * GET /api/health
 *
 * Used by:
 *   - Docker HEALTHCHECK instruction
 *   - Cloudflare health monitor (optional)
 *   - Uptime tracking services
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  // LOW-4: return minimal response — no timestamp or internal details
  return Response.json({ status: 'ok' })
}
