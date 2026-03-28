/**
 * GET /api/health
 *
 * Used by:
 *   - Docker HEALTHCHECK instruction
 *   - Cloudflare health monitor (optional)
 *   - Uptime tracking services
 */
import { version } from '@/package.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({
    status: 'ok',
    version,
    timestamp: new Date().toISOString(),
  })
}
