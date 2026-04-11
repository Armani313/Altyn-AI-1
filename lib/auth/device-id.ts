export const DEVICE_ID_COOKIE = 'luminify_device_id'

export const DEVICE_ID_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365 * 2,
}

export function generateDeviceId() {
  return crypto.randomUUID()
}
