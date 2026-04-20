'use client'

import { useEffect } from 'react'

type WebMcpTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (input?: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>
}

type WebMcpHandle =
  | void
  | (() => void)
  | {
      dispose?: () => void
    }

type ModelContextApi = {
  provideContext?: (context: { tools: WebMcpTool[] }) => Promise<WebMcpHandle> | WebMcpHandle
}

function getLocalePrefix() {
  if (typeof document === 'undefined') return ''
  return document.documentElement.lang.toLowerCase().startsWith('ru') ? '/ru' : ''
}

function toLocalizedPath(pathname: string) {
  return `${getLocalePrefix()}${pathname}`
}

function navigate(pathname: string) {
  const url = toLocalizedPath(pathname)
  window.location.assign(url)
  return {
    ok: true,
    navigatedTo: url,
  }
}

function registerTools(modelContext: ModelContextApi) {
  return modelContext.provideContext?.({
    tools: [
      {
        name: 'navigate_public_page',
        description: 'Open a public Luminify page such as pricing, FAQ, tools, or contact.',
        inputSchema: {
          type: 'object',
          properties: {
            page: {
              type: 'string',
              enum: ['home', 'pricing', 'about', 'faq', 'tools', 'contacts', 'privacy', 'terms'],
            },
          },
          required: ['page'],
          additionalProperties: false,
        },
        execute: async (input) => {
          switch (input?.page) {
            case 'pricing':
              return navigate('/#pricing')
            case 'about':
              return navigate('/about')
            case 'faq':
              return navigate('/faq')
            case 'tools':
              return navigate('/tools')
            case 'contacts':
              return navigate('/contacts')
            case 'privacy':
              return navigate('/privacy')
            case 'terms':
              return navigate('/terms')
            case 'home':
            default:
              return navigate('/')
          }
        },
      },
      {
        name: 'open_tool_page',
        description: 'Open a public Luminify image tool landing page.',
        inputSchema: {
          type: 'object',
          properties: {
            slug: {
              type: 'string',
              enum: [
                'background-remover',
                'white-background',
                'blur-background',
                'change-background-color',
                'add-background',
                'photo-enhancer',
              ],
            },
          },
          required: ['slug'],
          additionalProperties: false,
        },
        execute: async (input) => {
          const slug = typeof input?.slug === 'string' ? input.slug : 'background-remover'
          return navigate(`/tools/${slug}`)
        },
      },
      {
        name: 'start_free_trial',
        description: 'Open the Luminify signup page to start the free trial.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
        },
        execute: async () => navigate('/register'),
      },
    ],
  })
}

export function WebMcpProvider() {
  useEffect(() => {
    const modelContext = (navigator as Navigator & { modelContext?: ModelContextApi }).modelContext

    if (!modelContext?.provideContext) {
      return
    }

    let dispose: (() => void) | undefined

    Promise.resolve(registerTools(modelContext))
      .then((handle) => {
        if (typeof handle === 'function') {
          dispose = handle
          return
        }

        if (handle && typeof handle.dispose === 'function') {
          dispose = () => handle.dispose?.()
        }
      })
      .catch(() => {
        // WebMCP is still experimental; ignore unsupported browser/runtime failures.
      })

    return () => {
      dispose?.()
    }
  }, [])

  return null
}
