import {
  API_CATALOG_PROFILE,
  applyAgentHeaders,
  getApiCatalogDocument,
  getAppUrl,
  getRequestOrigin,
} from '@/lib/agent-ready'

export const runtime = 'nodejs'

function buildHeaders(origin = getAppUrl()) {
  const headers = new Headers()

  applyAgentHeaders(headers, {
    allowCors: true,
    contentType: `application/linkset+json; profile="${API_CATALOG_PROFILE}"; charset=utf-8`,
    origin,
  })
  headers.set('Allow', 'GET, HEAD, OPTIONS')
  headers.append(
    'Link',
    `<${new URL('/.well-known/api-catalog', origin).toString()}>; rel="self"; type="application/linkset+json"; profile="${API_CATALOG_PROFILE}"`
  )

  return headers
}

export async function GET(request: Request) {
  const origin = getRequestOrigin(request)
  const headers = buildHeaders(origin)

  return new Response(JSON.stringify(getApiCatalogDocument(origin), null, 2), {
    status: 200,
    headers,
  })
}

export async function HEAD(request: Request) {
  const origin = getRequestOrigin(request)
  return new Response(null, {
    status: 200,
    headers: buildHeaders(origin),
  })
}

export async function OPTIONS(request: Request) {
  const origin = getRequestOrigin(request)
  return new Response(null, {
    status: 204,
    headers: buildHeaders(origin),
  })
}
