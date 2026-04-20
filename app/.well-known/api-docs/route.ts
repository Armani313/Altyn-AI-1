import { applyAgentHeaders, getApiDocsMarkdown } from '@/lib/agent-ready'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
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
