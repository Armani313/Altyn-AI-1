#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const lockPath = join(root, 'package-lock.json')

let lock
try {
  lock = JSON.parse(readFileSync(lockPath, 'utf8'))
} catch (err) {
  console.error(`[check-lockfile] cannot read ${lockPath}: ${err.message}`)
  process.exit(1)
}

const issues = []
const packages = lock.packages || {}

for (const [path, entry] of Object.entries(packages)) {
  if (path === '') continue
  if (!entry || typeof entry !== 'object') {
    issues.push(`${path}: not an object`)
    continue
  }
  if (entry.link) continue
  if (!('version' in entry) || typeof entry.version !== 'string' || entry.version === '') {
    issues.push(`${path}: missing or empty "version" (entry keys: ${Object.keys(entry).join(', ')})`)
  }
}

if (issues.length > 0) {
  console.error('[check-lockfile] package-lock.json has invalid entries:')
  for (const line of issues) console.error('  - ' + line)
  console.error('\nFix: delete package-lock.json and run `npm install --legacy-peer-deps` on the same Node version as CI (Node 20).')
  process.exit(1)
}

console.log(`[check-lockfile] OK — ${Object.keys(packages).length} entries valid`)
