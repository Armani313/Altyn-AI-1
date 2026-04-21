import {
  buildMarkdownDocument,
  buildMarkdownHeaders,
  getRequestOrigin,
} from '@/lib/markdown-for-agents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSourceUrl(request: Request) {
  const requestOrigin = getRequestOrigin(request)
  const requestUrl = new URL(request.url)
  const sourcePath = requestUrl.searchParams.get('path') ?? '/'

  if (!sourcePath.startsWith('/') || sourcePath.startsWith('/api/agent-markdown')) {
    throw new Error('Invalid markdown source path.')
  }

  return new URL(sourcePath, requestOrigin)
}

export async function GET(request: Request) {
  try {
    const sourceUrl = getSourceUrl(request)
    const { markdown, tokens } = await buildMarkdownDocument(request, sourceUrl)

    return new Response(markdown, {
      status: 200,
      headers: buildMarkdownHeaders(tokens, sourceUrl.origin),
    })
  } catch (error) {
    const message = error instanceof Error && error.message
      ? error.message
      : 'Unable to generate markdown.'
    console.error('[agent-markdown] Failed to generate markdown:', error)
    return Response.json(
      { error: message },
      { status: 502 }
    )
  }
}

export async function HEAD(request: Request) {
  try {
    const sourceUrl = getSourceUrl(request)
    const { tokens } = await buildMarkdownDocument(request, sourceUrl)

    return new Response(null, {
      status: 200,
      headers: buildMarkdownHeaders(tokens, sourceUrl.origin),
    })
  } catch {
    return new Response(null, { status: 400 })
  }
}
