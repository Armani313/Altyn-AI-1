// ── Route classification ──────────────────────────────────────────────────────
// Used by middleware.ts and lib/supabase/middleware.ts for route protection.
// Add new dashboard pages here — no need to update middleware manually.

/** Require auth. Unauthenticated visitors are redirected to /login. */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/library',
  '/generate',
  '/history',
  '/settings',
]

/** Require NO auth. Authenticated users are redirected to /dashboard. */
export const AUTH_ROUTES = ['/login', '/register', '/forgot-password']
