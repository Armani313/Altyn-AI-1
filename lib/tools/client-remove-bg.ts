/**
 * Client-side helper to call /api/tools/remove-bg.
 * Returns a Blob with the background-removed PNG.
 */
export async function clientRemoveBg(
  file: File,
  signal?: AbortSignal,
): Promise<Blob> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('/api/tools/remove-bg', {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Ошибка сервера (${response.status})`)
  }

  return response.blob()
}
