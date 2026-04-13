/**
 * GET /api/tools/temp-serve/[id]
 *
 * Serves a temporary image from the in-memory store. Used as the source URL
 * for Cloudflare Image Transformations (same-zone fetch). Each image is
 * one-time read — it's deleted immediately after being served.
 */

import { NextResponse } from 'next/server'
import { popTempImage } from '@/lib/tools/temp-image-store'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Basic UUID format check
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const entry = popTempImage(id)
  if (!entry) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }

  return new NextResponse(Buffer.from(entry.data), {
    status: 200,
    headers: {
      'Content-Type': entry.mime,
      'Cache-Control': 'no-store',
    },
  })
}
