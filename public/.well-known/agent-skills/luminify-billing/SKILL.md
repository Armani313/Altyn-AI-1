---
name: luminify-billing
description: Understand Luminify’s existing billing flows backed by Polar checkout and the customer portal.
---

# Luminify Billing

## What exists today

- Billing is handled through Polar checkout sessions created by `POST /api/checkout`.
- Existing subscribers can reach the hosted customer portal via `GET /api/portal`.
- The public pricing summary is available on the landing page and in `/.well-known/api-docs`.

## Guidance

- Billing APIs require authentication.
- Treat Polar as the current merchant and subscription backend for this site.
- The current site does not yet expose x402, UCP, or ACP commerce flows.
