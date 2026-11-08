import type { HeadersFunction } from 'react-router'

// Same CDN policy as the Frontity site: lists change whenever a post is
// published, single posts rarely change after publishing. Vercel's CDN keeps
// serving the stale copy for a day while it revalidates in the background.
export const CACHE = {
  list: 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
  post: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  xml: 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  feed: 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
  error: 'public, max-age=0, s-maxage=60',
  none: 'private, no-store',
} as const

// Route `headers` export: cache the page, but cache errors (404s) briefly.
export function cacheHeaders(cacheControl: string): HeadersFunction {
  return ({ errorHeaders }) => ({
    'Cache-Control': errorHeaders ? CACHE.error : cacheControl,
  })
}
