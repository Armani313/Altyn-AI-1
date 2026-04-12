/**
 * GET /api/health/integrity
 *
 * Readiness-style integrity check for operations:
 *   - validates critical billing env/config
 *   - validates Supabase service-role connectivity
 *   - validates required schema columns exist
 *   - validates profile emails are fully backfilled
 */

import { runIntegrityChecks } from '@/lib/ops/run-integrity-checks'
import type { IntegrityReport } from '@/lib/ops/run-integrity-checks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function redactReport(report: IntegrityReport): IntegrityReport {
  return {
    ok: report.ok,
    checkedAt: report.checkedAt,
    checks: report.checks.map(({ name, ok }) => ({ name, ok })),
  }
}

export async function GET(request: Request) {
  const report = await runIntegrityChecks()
  const secret = process.env.CRON_SECRET?.trim()
  const providedSecret = request.headers.get('x-health-secret')?.trim()
  const canViewFullReport = Boolean(secret) && providedSecret === secret

  return Response.json(canViewFullReport ? report : redactReport(report), {
    status: report.ok ? 200 : 503,
  })
}
