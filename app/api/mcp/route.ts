import {
  applyAgentHeaders,
  callMcpTool,
  getAppUrl,
  MCP_PROTOCOL_VERSION,
  MCP_TOOLS,
} from '@/lib/agent-ready'

export const runtime = 'nodejs'

type JsonRpcId = number | string | null

type JsonRpcRequest = {
  id?: JsonRpcId
  jsonrpc?: string
  method?: string
  params?: Record<string, unknown>
}

function buildHeaders(origin = getAppUrl()) {
  const headers = new Headers()

  applyAgentHeaders(headers, {
    allowCors: true,
    contentType: 'application/json; charset=utf-8',
    origin,
  })
  headers.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id')

  return headers
}

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  }
}

function jsonRpcError(id: JsonRpcId, code: number, message: string) {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  }
}

function handleRequest(message: JsonRpcRequest) {
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return jsonRpcError(message.id ?? null, -32600, 'Invalid Request')
  }

  switch (message.method) {
    case 'initialize':
      return jsonRpcResult(message.id ?? null, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'luminify-site-tools',
          title: 'Luminify Site Tools',
          version: '1.0.0',
          description: 'Read-only site and API discovery tools for Luminify.',
          websiteUrl: getAppUrl(),
        },
        instructions:
          'This server is read-only. Use tools/list and tools/call for discovery-oriented tasks.',
      })

    case 'notifications/initialized':
      return null

    case 'ping':
      return jsonRpcResult(message.id ?? null, {})

    case 'tools/list':
      return jsonRpcResult(message.id ?? null, {
        tools: MCP_TOOLS,
      })

    case 'tools/call': {
      const name = typeof message.params?.name === 'string' ? message.params.name : ''
      const args =
        message.params && typeof message.params.arguments === 'object' && message.params.arguments
          ? (message.params.arguments as Record<string, unknown>)
          : {}
      const toolResult = callMcpTool(name, args)

      if (!toolResult) {
        return jsonRpcError(message.id ?? null, -32602, `Unknown tool: ${name}`)
      }

      return jsonRpcResult(message.id ?? null, toolResult)
    }

    default:
      return jsonRpcError(message.id ?? null, -32601, `Method not found: ${message.method}`)
  }
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(
    JSON.stringify(
      {
        name: 'Luminify Site Tools',
        transport: 'streamable-http',
        endpoint: '/api/mcp',
      },
      null,
      2
    ),
    {
      status: 200,
      headers: buildHeaders(origin),
    }
  )
}

export async function HEAD(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(null, {
    status: 200,
    headers: buildHeaders(origin),
  })
}

export async function OPTIONS(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(null, {
    status: 204,
    headers: buildHeaders(origin),
  })
}

export async function POST(request: Request) {
  const headers = buildHeaders(new URL(request.url).origin)
  const payload = (await request.json()) as JsonRpcRequest | JsonRpcRequest[]

  if (Array.isArray(payload)) {
    const responses = payload
      .map(handleRequest)
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

    return new Response(JSON.stringify(responses, null, 2), {
      status: 200,
      headers,
    })
  }

  const response = handleRequest(payload)

  if (!response) {
    return new Response(null, {
      status: 202,
      headers,
    })
  }

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers,
  })
}
