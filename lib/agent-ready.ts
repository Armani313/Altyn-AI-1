export const CONTENT_SIGNAL_POLICY = 'ai-train=no, search=yes, ai-input=no'
export const API_CATALOG_PROFILE = 'https://www.rfc-editor.org/info/rfc9727'
export const AGENT_SKILLS_SCHEMA_URL = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
export const MCP_SERVER_CARD_SCHEMA_URL =
  'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json'
export const MCP_PROTOCOL_VERSION = '2025-06-18'

const DEFAULT_APP_URL = 'https://luminify.app'
const SUPPORT_EMAIL = 'support@luminify.app'

export type ApiEndpoint = {
  auth: 'public' | 'bearer'
  contentType: string
  method: 'GET' | 'POST'
  path: string
  summary: string
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    auth: 'public',
    contentType: 'application/json',
    summary: 'Health check for uptime probes and agent discovery.',
  },
  {
    method: 'POST',
    path: '/api/generate/demo',
    auth: 'public',
    contentType: 'application/json',
    summary: 'Free demo image generation from a product photo upload.',
  },
  {
    method: 'POST',
    path: '/api/tools/remove-bg',
    auth: 'public',
    contentType: 'image/png',
    summary: 'Public background-removal tool for the marketing funnel.',
  },
  {
    method: 'POST',
    path: '/api/tools/upscale',
    auth: 'public',
    contentType: 'image/png',
    summary: 'Public Topaz-powered image upscale endpoint for the marketing funnel.',
  },
  {
    method: 'POST',
    path: '/api/tools/topaz-image',
    auth: 'public',
    contentType: 'image/png',
    summary: 'Public Topaz image enhancement endpoint for the marketing funnel.',
  },
  {
    method: 'GET',
    path: '/api/models',
    auth: 'bearer',
    contentType: 'application/json',
    summary: 'Lists authenticated users’ custom model assets.',
  },
  {
    method: 'GET',
    path: '/api/card-templates',
    auth: 'bearer',
    contentType: 'application/json',
    summary: 'Returns authenticated users’ active card template catalog.',
  },
  {
    method: 'GET',
    path: '/api/video-templates',
    auth: 'bearer',
    contentType: 'application/json',
    summary: 'Returns authenticated users’ active video template catalog.',
  },
  {
    method: 'POST',
    path: '/api/checkout',
    auth: 'bearer',
    contentType: 'application/json',
    summary: 'Creates a Polar checkout session for plans or credit packs.',
  },
  {
    method: 'GET',
    path: '/api/portal',
    auth: 'bearer',
    contentType: 'text/html',
    summary: 'Redirects authenticated users to the Polar customer portal.',
  },
]

export const PUBLIC_PAGES = [
  { title: 'Landing', path: '/' },
  { title: 'About', path: '/about' },
  { title: 'FAQ', path: '/faq' },
  { title: 'Contact', path: '/contacts' },
  { title: 'Tools', path: '/tools' },
  { title: 'Background Remover', path: '/tools/background-remover' },
  { title: 'White Background', path: '/tools/white-background' },
  { title: 'Blur Background', path: '/tools/blur-background' },
  { title: 'Change Background Color', path: '/tools/change-background-color' },
  { title: 'Add Background', path: '/tools/add-background' },
  { title: 'Photo Enhancer', path: '/tools/photo-enhancer' },
  { title: 'Privacy', path: '/privacy' },
  { title: 'Terms', path: '/terms' },
] as const

export const MCP_TOOLS = [
  {
    name: 'get_site_overview',
    title: 'Site Overview',
    description: 'Get a concise overview of Luminify, its discovery endpoints, and public experience.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
  },
  {
    name: 'list_public_pages',
    title: 'List Public Pages',
    description: 'List public website pages and tool landing pages available without authentication.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
  },
  {
    name: 'list_api_endpoints',
    title: 'List API Endpoints',
    description: 'List public or authenticated HTTP API endpoints exposed by Luminify.',
    inputSchema: {
      type: 'object',
      properties: {
        visibility: {
          type: 'string',
          enum: ['all', 'public', 'authenticated'],
          description: 'Filter endpoints by required authentication.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_pricing_summary',
    title: 'Pricing Summary',
    description: 'Return the current public pricing summary and signup offer shown on the marketing site.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
  },
  {
    name: 'get_contact_details',
    title: 'Contact Details',
    description: 'Return support contact details and the best public pages for follow-up.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
  },
] as const

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function toAbsoluteUrl(origin: string, pathname: string) {
  return new URL(pathname, `${trimTrailingSlash(origin)}/`).toString()
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
}

function getSupabaseIssuer() {
  const supabaseUrl = getSupabaseUrl()
  return supabaseUrl ? `${trimTrailingSlash(supabaseUrl)}/auth/v1` : ''
}

function appendHeader(headers: Headers, name: string, value: string) {
  const existing = headers.get(name)
  headers.set(name, existing ? `${existing}, ${value}` : value)
}

export function getAppUrl() {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL)
}

function firstHeaderValue(headers: Headers, name: string) {
  const value = headers.get(name)?.split(',')[0]?.trim()
  return value || null
}

export function getRequestOrigin(request: Request) {
  const forwardedHost = firstHeaderValue(request.headers, 'x-forwarded-host')
  const host = forwardedHost || firstHeaderValue(request.headers, 'host')
  const forwardedProto = firstHeaderValue(request.headers, 'x-forwarded-proto')

  if (host) {
    const protocol = (forwardedProto || 'https').replace(/:$/, '')
    const hostname = host.toLowerCase()
    const isLoopback = /^(?:0\.0\.0\.0|127\.0\.0\.1|localhost)(?::\d+)?$/.test(hostname)

    if (!isLoopback) {
      return `${protocol}://${host}`
    }
  }

  try {
    const fromUrl = new URL(request.url).origin
    if (!/^https?:\/\/(?:0\.0\.0\.0|127\.0\.0\.1|localhost)(?::\d+)?$/.test(fromUrl)) {
      return fromUrl
    }
  } catch {
    // Fall through to getAppUrl fallback.
  }

  return getAppUrl()
}

export function getAgentDiscoveryLinkHeader(origin = getAppUrl()) {
  return `<${toAbsoluteUrl(origin, '/.well-known/api-catalog')}>; rel="api-catalog"; type="application/linkset+json"; profile="${API_CATALOG_PROFILE}"`
}

export function applyAgentHeaders(
  headers: Headers,
  options: {
    allowCors?: boolean
    contentType?: string
    origin?: string
    varyAccept?: boolean
  } = {}
) {
  if (options.contentType) {
    headers.set('Content-Type', options.contentType)
  }

  headers.set('Content-Signal', CONTENT_SIGNAL_POLICY)
  appendHeader(headers, 'Link', getAgentDiscoveryLinkHeader(options.origin || getAppUrl()))

  if (options.allowCors) {
    headers.set('Access-Control-Allow-Origin', '*')
  }

  if (options.varyAccept) {
    appendHeader(headers, 'Vary', 'Accept')
  }
}

export function getOpenIdConfiguration(origin = getAppUrl()) {
  const issuer = getSupabaseIssuer()

  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    scopes_supported: ['openid', 'profile', 'email', 'phone'],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'HS256', 'ES256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256', 'plain'],
    service_documentation: toAbsoluteUrl(origin, '/.well-known/api-docs'),
    protected_resources: [toAbsoluteUrl(origin, '/api')],
  }
}

export function getOAuthAuthorizationServerMetadata(origin = getAppUrl()) {
  const oidc = getOpenIdConfiguration(origin)

  return {
    issuer: oidc.issuer,
    authorization_endpoint: oidc.authorization_endpoint,
    token_endpoint: oidc.token_endpoint,
    jwks_uri: oidc.jwks_uri,
    grant_types_supported: oidc.grant_types_supported,
    response_types_supported: oidc.response_types_supported,
    response_modes_supported: oidc.response_modes_supported,
    scopes_supported: oidc.scopes_supported,
    token_endpoint_auth_methods_supported: oidc.token_endpoint_auth_methods_supported,
    code_challenge_methods_supported: oidc.code_challenge_methods_supported,
    service_documentation: oidc.service_documentation,
    protected_resources: oidc.protected_resources,
  }
}

export function getProtectedResourceMetadata(origin = getAppUrl()) {
  return {
    resource: toAbsoluteUrl(origin, '/api'),
    authorization_servers: [getSupabaseIssuer()],
    scopes_supported: ['openid', 'profile', 'email'],
    bearer_methods_supported: ['header'],
    resource_name: 'Luminify API',
    resource_documentation: toAbsoluteUrl(origin, '/.well-known/api-docs'),
  }
}

export function getApiCatalogDocument(origin = getAppUrl()) {
  const openApiUrl = toAbsoluteUrl(origin, '/.well-known/openapi.json')
  const docsUrl = toAbsoluteUrl(origin, '/.well-known/api-docs')
  const healthUrl = toAbsoluteUrl(origin, '/api/health')

  return {
    linkset: [
      {
        anchor: toAbsoluteUrl(origin, '/api'),
        'service-desc': [
          {
            href: openApiUrl,
            type: 'application/openapi+json',
          },
        ],
        'service-doc': [
          {
            href: docsUrl,
            type: 'text/markdown',
          },
        ],
        status: [
          {
            href: healthUrl,
            type: 'application/json',
          },
        ],
        item: API_ENDPOINTS.map((endpoint) => ({
          href: toAbsoluteUrl(origin, endpoint.path),
          title: `${endpoint.method} ${endpoint.path}`,
        })),
      },
    ],
  }
}

export function getOpenApiDocument(origin = getAppUrl()) {
  const oidcUrl = toAbsoluteUrl(origin, '/.well-known/openid-configuration')

  return {
    openapi: '3.1.0',
    info: {
      title: 'Luminify HTTP API',
      version: '1.0.0',
      summary: 'Public discovery document for Luminify’s public and authenticated HTTP APIs.',
      description:
        'This specification focuses on API discovery for AI agents and integrators. Public image-tool routes are callable without authentication, while account and billing routes require a Supabase bearer token.',
    },
    servers: [
      {
        url: origin,
      },
    ],
    security: [],
    tags: [
      { name: 'public', description: 'Endpoints available without authentication.' },
      { name: 'authenticated', description: 'Endpoints requiring a Supabase bearer token.' },
      { name: 'billing', description: 'Billing and checkout endpoints backed by Polar.' },
    ],
    paths: {
      '/api/health': {
        get: {
          operationId: 'getHealth',
          tags: ['public'],
          summary: 'Return a health status payload.',
          responses: {
            '200': {
              description: 'Service health response.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                    required: ['status', 'timestamp'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/generate/demo': {
        post: {
          operationId: 'createDemoGeneration',
          tags: ['public'],
          summary: 'Generate a free demo image from an uploaded product photo.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                    },
                    model_id: {
                      type: 'string',
                      description: 'Optional static model preset identifier.',
                    },
                  },
                  required: ['image'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful demo generation.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      outputUrl: { type: 'string', format: 'uri' },
                    },
                    required: ['success', 'outputUrl'],
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/remove-bg': {
        post: {
          operationId: 'removeBackground',
          tags: ['public'],
          summary: 'Remove the background from an uploaded image.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                  required: ['image'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Background-removed image bytes.',
              content: {
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/upscale': {
        post: {
          operationId: 'upscaleImage',
          tags: ['public'],
          summary: 'Upscale an uploaded image using the public Topaz funnel.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                    },
                    scale: {
                      type: 'string',
                      enum: ['2x', '4x'],
                    },
                  },
                  required: ['image'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Upscaled image bytes.',
              content: {
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
      },
      '/api/tools/topaz-image': {
        post: {
          operationId: 'enhanceTopazImage',
          tags: ['public'],
          summary: 'Apply a public Topaz image enhancement tool to an uploaded image.',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                    },
                    toolSlug: {
                      type: 'string',
                      description: 'Public Topaz tool identifier from the marketing site.',
                    },
                    scale: {
                      type: 'string',
                      enum: ['2x', '4x'],
                    },
                  },
                  required: ['image', 'toolSlug'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Processed image bytes.',
              content: {
                'image/png': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
      },
      '/api/models': {
        get: {
          operationId: 'listModels',
          tags: ['authenticated'],
          summary: 'List authenticated users’ custom model asset URLs.',
          security: [{ supabaseOidc: ['openid', 'profile', 'email'] }],
          responses: {
            '200': {
              description: 'Signed model URLs.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      urls: {
                        type: 'array',
                        items: { type: 'string', format: 'uri' },
                      },
                    },
                    required: ['urls'],
                  },
                },
              },
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
          },
        },
      },
      '/api/card-templates': {
        get: {
          operationId: 'listCardTemplates',
          tags: ['authenticated'],
          summary: 'List authenticated card templates.',
          security: [{ supabaseOidc: ['openid', 'profile', 'email'] }],
          responses: {
            '200': {
              description: 'Card template list.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        category: { type: 'string' },
                        imageUrl: { type: 'string', format: 'uri' },
                        label: { type: 'string' },
                        premium: { type: 'boolean' },
                      },
                      required: ['id', 'name', 'category', 'imageUrl', 'premium'],
                    },
                  },
                },
              },
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
          },
        },
      },
      '/api/video-templates': {
        get: {
          operationId: 'listVideoTemplates',
          tags: ['authenticated'],
          summary: 'List authenticated video templates.',
          security: [{ supabaseOidc: ['openid', 'profile', 'email'] }],
          responses: {
            '200': {
              description: 'Video template list.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        coverImageUrl: { type: 'string', format: 'uri' },
                        demoVideoUrl: { type: 'string', format: 'uri' },
                        aspectRatio: { type: 'string' },
                        label: { type: 'string' },
                        premium: { type: 'boolean' },
                      },
                      required: ['id', 'name', 'description', 'coverImageUrl', 'premium'],
                    },
                  },
                },
              },
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
          },
        },
      },
      '/api/checkout': {
        post: {
          operationId: 'createCheckoutSession',
          tags: ['authenticated', 'billing'],
          summary: 'Create a Polar checkout session for a plan or credit pack.',
          security: [{ supabaseOidc: ['openid', 'profile', 'email'] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    plan: {
                      type: 'string',
                      enum: ['starter', 'pro', 'business'],
                    },
                    pack: {
                      type: 'string',
                      enum: ['topup_25', 'topup_100', 'topup_250'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Checkout session payload.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', format: 'uri' },
                    },
                    required: ['url'],
                  },
                },
              },
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
          },
        },
      },
      '/api/portal': {
        get: {
          operationId: 'openBillingPortal',
          tags: ['authenticated', 'billing'],
          summary: 'Redirect an authenticated user to the Polar customer portal.',
          security: [{ supabaseOidc: ['openid', 'profile', 'email'] }],
          responses: {
            '302': {
              description: 'Redirect to the hosted customer portal.',
            },
            '401': {
              $ref: '#/components/responses/Unauthorized',
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        supabaseOidc: {
          type: 'openIdConnect',
          openIdConnectUrl: oidcUrl,
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid bearer token.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                },
                required: ['error'],
              },
            },
          },
        },
      },
    },
  }
}

export function getApiDocsMarkdown(origin = getAppUrl()) {
  const discoveryUrls = {
    apiCatalog: toAbsoluteUrl(origin, '/.well-known/api-catalog'),
    openapi: toAbsoluteUrl(origin, '/.well-known/openapi.json'),
    oidc: toAbsoluteUrl(origin, '/.well-known/openid-configuration'),
    oauthServer: toAbsoluteUrl(origin, '/.well-known/oauth-authorization-server'),
    protectedResource: toAbsoluteUrl(origin, '/.well-known/oauth-protected-resource'),
  }

  const publicEndpoints = API_ENDPOINTS.filter((endpoint) => endpoint.auth === 'public')
  const authenticatedEndpoints = API_ENDPOINTS.filter((endpoint) => endpoint.auth === 'bearer')

  return [
    '---',
    'title: Luminify API documentation',
    `url: ${toAbsoluteUrl(origin, '/.well-known/api-docs')}`,
    '---',
    '',
    '# Luminify API',
    '',
    '## Discovery',
    `- API catalog: ${discoveryUrls.apiCatalog}`,
    `- OpenAPI document: ${discoveryUrls.openapi}`,
    `- OIDC discovery: ${discoveryUrls.oidc}`,
    `- OAuth authorization server metadata: ${discoveryUrls.oauthServer}`,
    `- OAuth protected resource metadata: ${discoveryUrls.protectedResource}`,
    '',
    '## Authentication',
    '- Public marketing and demo endpoints do not require authentication.',
    '- Authenticated endpoints expect a Supabase bearer token in the `Authorization` header.',
    '- The published discovery metadata points agents to the Supabase-backed issuer used by the site.',
    '',
    '## Public endpoints',
    ...publicEndpoints.map(
      (endpoint) => `- \`${endpoint.method} ${endpoint.path}\` — ${endpoint.summary}`
    ),
    '',
    '## Authenticated endpoints',
    ...authenticatedEndpoints.map(
      (endpoint) => `- \`${endpoint.method} ${endpoint.path}\` — ${endpoint.summary}`
    ),
    '',
    '## Billing',
    '- Billing is currently backed by Polar checkout and the Polar customer portal.',
    '- The existing site does not yet expose x402, UCP, or ACP commerce flows.',
  ].join('\n')
}

function buildToolText(title: string, payload: unknown) {
  return `${title}\n\n${JSON.stringify(payload, null, 2)}`
}

function createToolResult(title: string, structuredContent: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: buildToolText(title, structuredContent),
      },
    ],
    structuredContent,
    isError: false,
  }
}

export function getMcpServerCard(origin = getAppUrl()) {
  return {
    $schema: MCP_SERVER_CARD_SCHEMA_URL,
    version: '1.0',
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: {
      name: 'luminify-site-tools',
      title: 'Luminify Site Tools',
      version: '1.0.0',
      description: 'Read-only site, pricing, and API discovery helpers for Luminify.',
      websiteUrl: origin,
    },
    description: 'Read-only MCP server for Luminify site orientation and API discovery.',
    documentationUrl: toAbsoluteUrl(origin, '/.well-known/api-docs'),
    transport: {
      type: 'streamable-http',
      endpoint: '/api/mcp',
    },
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    authentication: {
      required: false,
      schemes: [],
    },
    instructions:
      'Use these tools for discovery and planning. Call the published OAuth and API catalog endpoints for authenticated HTTP integration details.',
    resources: [],
    prompts: [],
    tools: MCP_TOOLS,
  }
}

export function callMcpTool(name: string, rawArgs: Record<string, unknown> = {}) {
  const origin = getAppUrl()

  switch (name) {
    case 'get_site_overview':
      return createToolResult('Luminify site overview', {
        product: 'Luminify',
        description:
          'AI product photography for apparel, cosmetics, and jewelry brands, with free marketing tools and authenticated generation workflows.',
        discovery: {
          apiCatalog: toAbsoluteUrl(origin, '/.well-known/api-catalog'),
          openapi: toAbsoluteUrl(origin, '/.well-known/openapi.json'),
          agentSkills: toAbsoluteUrl(origin, '/.well-known/agent-skills/index.json'),
          mcpServerCard: toAbsoluteUrl(origin, '/.well-known/mcp/server-card.json'),
        },
        contentSignal: CONTENT_SIGNAL_POLICY,
      })

    case 'list_public_pages':
      return createToolResult('Luminify public pages', {
        pages: PUBLIC_PAGES.map((page) => ({
          ...page,
          url: toAbsoluteUrl(origin, page.path),
        })),
      })

    case 'list_api_endpoints': {
      const visibility = rawArgs.visibility === 'public'
        ? 'public'
        : rawArgs.visibility === 'authenticated'
          ? 'authenticated'
          : 'all'

      const endpoints = API_ENDPOINTS.filter((endpoint) => {
        if (visibility === 'all') return true
        if (visibility === 'public') return endpoint.auth === 'public'
        return endpoint.auth === 'bearer'
      }).map((endpoint) => ({
        ...endpoint,
        url: toAbsoluteUrl(origin, endpoint.path),
      }))

      return createToolResult('Luminify API endpoints', {
        visibility,
        endpoints,
      })
    }

    case 'get_pricing_summary':
      return createToolResult('Luminify pricing summary', {
        freeOffer: '3 free generations on signup, no credit card required.',
        plans: [
          { name: 'Starter', priceUsdPerMonth: 1, credits: 10 },
          { name: 'Pro', priceUsdPerMonth: 10, credits: 100 },
          { name: 'Business', priceUsdPerMonth: 25, credits: 250 },
        ],
        topups: [
          { name: 'Top-up 25', priceUsd: 4, credits: 25 },
          { name: 'Top-up 100', priceUsd: 15, credits: 100 },
          { name: 'Top-up 250', priceUsd: 35, credits: 250 },
        ],
      })

    case 'get_contact_details':
      return createToolResult('Luminify contact details', {
        supportEmail: SUPPORT_EMAIL,
        contactPage: toAbsoluteUrl(origin, '/contacts'),
        faqPage: toAbsoluteUrl(origin, '/faq'),
        pricingPage: toAbsoluteUrl(origin, '/#pricing'),
      })

    default:
      return null
  }
}
