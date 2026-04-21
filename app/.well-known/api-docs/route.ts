import { applyAgentHeaders, getApiDocsMarkdown, getRequestOrigin } from '@/lib/agent-ready'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)
  const headers = new Headers()

  applyAgentHeaders(headers, {
    allowCors: true,
    contentType: 'text/markdown; charset=utf-8',
    origin,
    varyAccept: true,
  })

  return new Response(getApiDocsMarkdown(origin), {
    status: 200,
    headers,
  })
}
