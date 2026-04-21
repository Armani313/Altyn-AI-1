import { load } from 'cheerio'
import { NodeHtmlMarkdown } from 'node-html-markdown'
import { applyAgentHeaders, getRequestOrigin as getOrigin } from '@/lib/agent-ready'

const markdownConverter = new NodeHtmlMarkdown({
  bulletMarker: '-',
  codeFence: '```',
  emDelimiter: '_',
  strongDelimiter: '**',
})

const HTML_FETCH_TIMEOUT_MS = 15000

export function getRequestOrigin(request: Request) {
  return getOrigin(request)
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

async function fetchHtmlSource(
  request: Request,
  sourceUrl: URL,
  redirectCount = 0,
  cookieJar = parseCookieHeader(request.headers.get('cookie'))
): Promise<Response> {
  const languageHeader = request.headers.get('accept-language')
  const requestHeaders: Record<string, string> = {
    accept: 'text/html,application/xhtml+xml',
    'user-agent': 'LuminifyAgentMarkdown/1.0 (+https://luminify.app)',
    'x-agent-markdown-source': '1',
  }

  const cookieHeader = serializeCookieJar(cookieJar)
  if (cookieHeader) {
    requestHeaders.cookie = cookieHeader
  }

  if (languageHeader) {
    requestHeaders['accept-language'] = languageHeader
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HTML_FETCH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(sourceUrl, {
      method: 'GET',
      headers: requestHeaders,
      redirect: 'manual',
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timed out fetching HTML source after ${HTML_FETCH_TIMEOUT_MS}ms (${sourceUrl.toString()}).`)
    }
    const message = error instanceof Error && error.message ? error.message : 'network error'
    throw new Error(`Unable to fetch HTML source (${message}) for ${sourceUrl.toString()}.`)
  } finally {
    clearTimeout(timer)
  }

  const setCookieHeaders = response.headers.getSetCookie?.() ?? []
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
