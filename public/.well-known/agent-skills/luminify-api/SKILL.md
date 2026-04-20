---
name: luminify-api
description: Discover and authenticate against Luminify HTTP APIs using the published API catalog and OAuth metadata.
---

# Luminify API

## Discovery

- API catalog: `/.well-known/api-catalog`
- OpenAPI: `/.well-known/openapi.json`
- Human docs: `/.well-known/api-docs`

## Authentication

- OIDC discovery: `/.well-known/openid-configuration`
- OAuth authorization server metadata: `/.well-known/oauth-authorization-server`
- Protected resource metadata: `/.well-known/oauth-protected-resource`
- Authenticated endpoints expect a bearer token in the `Authorization` header.

## Useful endpoints

- `GET /api/health`
- `POST /api/generate/demo`
- `POST /api/tools/remove-bg`
- `POST /api/tools/upscale`
- `POST /api/tools/topaz-image`
- `GET /api/models` (auth)
- `GET /api/card-templates` (auth)
- `GET /api/video-templates` (auth)
- `POST /api/checkout` (auth)
- `GET /api/portal` (auth)
