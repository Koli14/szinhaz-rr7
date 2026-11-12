import { redirect } from 'react-router'
import type { HeadersFunction } from 'react-router'

// Pages are tagged with the WordPress content they show (cacheTags.server.ts)
// and WordPress invalidates the tags when that content changes, so the TTLs
// below are only a safety net in case an invalidation gets lost. Invalidated
// or expired pages are served stale while the CDN refreshes them in the
// background. A new deployment starts with an empty cache anyway.
export const CACHE = {
  list: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  post: 'public, max-age=0, s-maxage=604800, stale-while-revalidate=2592000',
  xml: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  feed: 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
  error: 'public, max-age=0, s-maxage=60',
  none: 'private, no-store',
  // Permanent redirects (missing trailing slash, old URLs): without it
  // every hit ran the function again
  redirect: 'public, max-age=3600, s-maxage=2592000',
} as const

// 301 that the CDN keeps, use with `throw`
export const permanentRedirect = (url: string) =>
  redirect(url, { status: 301, headers: { 'Cache-Control': CACHE.redirect } })

// Route `headers` export: cache the page, but cache errors (404s) briefly.
export function cacheHeaders(cacheControl: string): HeadersFunction {
  return ({ errorHeaders }) => ({
    'Cache-Control': errorHeaders ? CACHE.error : cacheControl,
  })
}
