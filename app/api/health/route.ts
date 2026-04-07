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
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
