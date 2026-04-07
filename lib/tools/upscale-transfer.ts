export const UPSCALE_SOURCE_IMAGE_KEY = 'luminify-upscale-source-image'

export function saveUpscaleSourceImage(url: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(UPSCALE_SOURCE_IMAGE_KEY, url)
}

export function readUpscaleSourceImage(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(UPSCALE_SOURCE_IMAGE_KEY)
}

export function clearUpscaleSourceImage() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(UPSCALE_SOURCE_IMAGE_KEY)
}
