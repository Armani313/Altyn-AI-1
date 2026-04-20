import http from 'node:http'
import https from 'node:https'
import { load } from 'cheerio'
import { NodeHtmlMarkdown } from 'node-html-markdown'
import { applyAgentHeaders } from '@/lib/agent-ready'

const markdownConverter = new NodeHtmlMarkdown({
  bulletMarker: '-',
  codeFence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
})

function getForwardedHeaderValue(headers: Headers, name: string) {
  const value = headers.get(name)?.split(',')[0]?.trim()
  return value || null
}

export function getRequestOrigin(request: Request) {
  const requestUrl = new URL(request.url)
  const forwardedProto = getForwardedHeaderValue(request.headers, 'x-forwarded-proto')
  const forwardedHost = getForwardedHeaderValue(request.headers, 'x-forwarded-host')
  const forwardedPort = getForwardedHeaderValue(request.headers, 'x-forwarded-port')
  const host = forwardedHost || getForwardedHeaderValue(request.headers, 'host')

  if (!host) {
    return requestUrl.origin
  }

  const protocol = (forwardedProto || requestUrl.protocol || 'https:').replace(/:$/, '')
  const hasExplicitPort = host.includes(':')
  const shouldAppendPort =
    Boolean(forwardedPort)
    && !hasExplicitPort
    && !((protocol === 'http' && forwardedPort === '80') || (protocol === 'https' && forwardedPort === '443'))

  return `${protocol}://${shouldAppendPort ? `${host}:${forwardedPort}` : host}`
}

function normalizeMarkdown(markdown: string) {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookieJar = new Map<string, string>()

  if (!cookieHeader) {
    return cookieJar
  }

  cookieHeader.split(';').forEach((part) => {
    const separatorIndex = part.indexOf('=')
    if (separatorIndex === -1) return

    const name = part.slice(0, separatorIndex).trim()
    const value = part.slice(separatorIndex + 1).trim()

    if (name) {
      cookieJar.set(name, value)
    }
  })

  return cookieJar
}

function serializeCookieJar(cookieJar: Map<string, string>) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

function mergeSetCookieHeaders(cookieJar: Map<string, string>, setCookieHeaders: string[]) {
  setCookieHeaders.forEach((setCookieHeader) => {
    const cookiePart = setCookieHeader.split(';', 1)[0]
    const separatorIndex = cookiePart.indexOf('=')
    if (separatorIndex === -1) return

    const name = cookiePart.slice(0, separatorIndex).trim()
    const value = cookiePart.slice(separatorIndex + 1).trim()

    if (name) {
      cookieJar.set(name, value)
    }
  })
}

function estimateMarkdownTokens(markdown: string) {
  const normalized = markdown.replace(/\s+/g, ' ').trim()
  return Math.max(1, Math.ceil(normalized.length / 4))
}

function absolutizeLinks(html: string, baseUrl: string) {
  const $ = load(html)

  $('[href]').each((_, element) => {
    const href = $(element).attr('href')
    if (!href || href.startsWith('#')) return

    try {
      $(element).attr('href', new URL(href, baseUrl).toString())
    } catch {
      // Ignore malformed URLs in source HTML.
    }
  })

  $('[src]').each((_, element) => {
    const src = $(element).attr('src')
    if (!src || src.startsWith('data:')) return

    try {
      $(element).attr('src', new URL(src, baseUrl).toString())
    } catch {
      // Ignore malformed URLs in source HTML.
    }
  })

  return $.html()
}

function extractMainHtml(html: string, baseUrl: string) {
  const $ = load(html)

  $('script, style, noscript, template, svg').remove()

  const title =
    $('meta[property="og:title"]').attr('content')?.trim()
    || $('title').first().text().trim()
    || $('h1').first().text().trim()
    || 'Luminify'

  const description =
    $('meta[name="description"]').attr('content')?.trim()
    || $('meta[property="og:description"]').attr('content')?.trim()
    || ''

  const canonical =
    $('link[rel="canonical"]').attr('href')?.trim()
    || baseUrl

  const main = $('main').first()
  const root = main.length ? main.clone() : $('body').clone()
  root.find('script, style, noscript, template, svg').remove()

  const mainHtml = absolutizeLinks(root.html() || '', baseUrl)

  return {
    title,
    description,
    canonical,
    mainHtml,
  }
}

async function requestHtmlSource(sourceUrl: URL, headers: Record<string, string>) {
  const client = sourceUrl.protocol === 'https:' ? https : http

  return new Promise<{ response: Response, setCookieHeaders: string[] }>((resolve, reject) => {
    const upstreamRequest = client.request(
      sourceUrl,
      {
        method: 'GET',
        headers,
      },
      (upstreamResponse) => {
        const chunks: Buffer[] = []

        upstreamResponse.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })
        upstreamResponse.on('error', reject)
        upstreamResponse.on('end', () => {
          const headers = new Headers()
          const setCookieHeaders = upstreamResponse.headers['set-cookie'] ?? []

          Object.entries(upstreamResponse.headers).forEach(([name, value]) => {
            if (!value) return

            headers.set(name, Array.isArray(value) ? value.join(', ') : value)
          })

          resolve(
            {
              response: new Response(Buffer.concat(chunks), {
                status: upstreamResponse.statusCode ?? 500,
                headers,
              }),
              setCookieHeaders: Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders],
            }
          )
        })
      }
    )

    upstreamRequest.on('error', reject)
    upstreamRequest.end()
  })
}

async function fetchHtmlSource(
  request: Request,
  sourceUrl: URL,
  redirectCount = 0,
  cookieJar = parseCookieHeader(request.headers.get('cookie'))
): Promise<Response> {
  const languageHeader = request.headers.get('accept-language')
  const requestHeaders: Record<string, string> = {
    accept: 'text/html,application/xhtml+xml',
    'x-agent-markdown-source': '1',
  }

  const cookieHeader = serializeCookieJar(cookieJar)
  if (cookieHeader) {
    requestHeaders.cookie = cookieHeader
  }

  if (languageHeader) {
    requestHeaders['accept-language'] = languageHeader
  }

  const { response, setCookieHeaders } = await requestHtmlSource(sourceUrl, requestHeaders)
  mergeSetCookieHeaders(cookieJar, setCookieHeaders)
  const isRedirect = response.status >= 300 && response.status < 400
  const location = response.headers.get('location')

  if (isRedirect && location) {
    if (redirectCount >= 5) {
      throw new Error('Unable to fetch HTML source (too many redirects).')
    }

    return fetchHtmlSource(request, new URL(location, sourceUrl), redirectCount + 1, cookieJar)
  }

  return response
}

export async function buildMarkdownDocument(request: Request, sourceUrl: URL) {
  const htmlResponse = await fetchHtmlSource(request, sourceUrl)

  if (!htmlResponse.ok) {
    throw new Error(`Unable to fetch HTML source (${htmlResponse.status}).`)
  }

  const html = await htmlResponse.text()
  const { title, description, canonical, mainHtml } = extractMainHtml(html, sourceUrl.toString())

  const markdownBody = normalizeMarkdown(markdownConverter.translate(mainHtml))

  const document = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `url: ${JSON.stringify(canonical)}`,
    ...(description ? [`description: ${JSON.stringify(description)}`] : []),
    '---',
    '',
    markdownBody || description || sourceUrl.toString(),
  ].join('\n')

  return {
    markdown: document,
    tokens: estimateMarkdownTokens(document),
  }
}

export function buildMarkdownHeaders(tokens: number, origin: string) {
  const headers = new Headers()

  applyAgentHeaders(headers, {
    contentType: 'text/markdown; charset=utf-8',
    origin,
    varyAccept: true,
  })
  headers.set('x-markdown-tokens', String(tokens))

  return headers
}

export function prefersMarkdown(request: Request) {
  const accept = request.headers.get('accept') ?? ''
  return accept.includes('text/markdown')
}
