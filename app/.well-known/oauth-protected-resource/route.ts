import { applyAgentHeaders, getProtectedResourceMetadata } from '@/lib/agent-ready'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const headers = new Headers()

  applyAgentHeaders(headers, {
    allowCors: true,
    contentType: 'application/json; charset=utf-8',
    origin,
  })

  return new Response(JSON.stringify(getProtectedResourceMetadata(origin), null, 2), {
    status: 200,
    headers,
  })
}
