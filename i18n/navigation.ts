import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware navigation helpers.
// Use these instead of next/navigation imports in components
// to ensure links/redirects preserve the current locale.
//
// Usage:
//   import { Link, redirect, useRouter, usePathname } from '@/i18n/navigation'
export const { Link, redirect, useRouter, usePathname, getPathname } =
  createNavigation(routing)
