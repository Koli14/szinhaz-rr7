import { redirect } from 'react-router'
import type { MiddlewareFunction } from 'react-router'

// Facebook adds a unique ?fbclid=… to every click, and the CDN caches by the
// full URL, so each Facebook visitor missed the cache and the page was
// rendered again. Redirect to the URL without it (no GraphQL, no render):
// the next request is a cache hit. Nothing on the site reads fbclid (no Meta
// Pixel); utm_* stay, GA4 reads them and they have few distinct values.
// A vercel.json redirect can't do this: it keeps the query string.
const TRACKING_PARAMS = ['fbclid']

export const trackingParamsMiddleware: MiddlewareFunction<Response> = (
  { request },
  next,
) => {
  const url = new URL(request.url)
  if (!TRACKING_PARAMS.some((param) => url.searchParams.has(param))) {
    return next()
  }
  for (const param of TRACKING_PARAMS) url.searchParams.delete(param)
  throw redirect(`${url.pathname}${url.search}`, {
    status: 301,
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
