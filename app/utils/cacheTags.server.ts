import { AsyncLocalStorage } from 'node:async_hooks'
import type { MiddlewareFunction } from 'react-router'

// WPGraphQL Smart Cache lists in the X-GraphQL-Keys response header which
// content a query touched: node ids (base64 `post:123`), lists (`list:post`)
// and `graphql:Query` on every query. When that content changes, it fires a
// `graphql_purge` event with the same keys. We tag the CDN response with the
// keys, and the WordPress side (mu-plugin szinhaz-vercel-purge.php) sends the
// purged keys to /api/revalidate, which invalidates exactly those pages.

const store = new AsyncLocalStorage<Set<string>>()

// Collect the keys of every GraphQL request made while handling `fn`
export function collectGraphqlKeys<T>(fn: () => Promise<T>) {
  return store.run(new Set(), async () => {
    const result = await fn()
    return { result, keys: store.getStore() ?? new Set<string>() }
  })
}

export function recordGraphqlKeys(header: string | null) {
  const keys = store.getStore()
  if (!keys || !header) return
  for (const key of header.split(/\s+/)) if (key) keys.add(key)
}

// Drop keys of content that is only shown in passing, so that editing it
// does not invalidate every page showing it
export function untrackGraphqlKeys(keys: Iterable<string>) {
  const tracked = store.getStore()
  if (!tracked) return
  for (const key of keys) tracked.delete(key)
}

// Vercel limits: 128 tags per response, 256 bytes per tag, no commas
export const MAX_TAGS = 128
const MAX_TAG_BYTES = 256

export const isValidTag = (tag: unknown): tag is string =>
  typeof tag === 'string' &&
  tag.length > 0 &&
  !tag.includes(',') &&
  !/\s/.test(tag) &&
  Buffer.byteLength(tag) <= MAX_TAG_BYTES

// Query document hashes: only purged when the query itself changes, which
// never happens here (the queries are in our code, not persisted in WP)
const isQueryHash = (key: string) => /^[0-9a-f]{64}$/.test(key)
// `operation:getRoot`: never purged, and every page has the same few
const isOperation = (key: string) => key.startsWith('operation:')

// `cG9zdDoxMjM=` → `post`
function nodeType(id: string) {
  const decoded = Buffer.from(id, 'base64').toString('utf8')
  const type = decoded.split(':')[0]
  return /^[a-z_]+$/.test(type) ? type : null
}

// Broad keys (`graphql:Query`, `list:*`, `skipped:*`) always fit. If there are
// too many node ids, the dropped ones are covered by `skipped:<type>`, which
// Smart Cache purges whenever any node of that type changes.
export function toCacheTags(keys: Iterable<string>): string[] {
  const broad = new Set<string>()
  const nodes: string[] = []
  for (const key of keys) {
    if (!isValidTag(key) || isQueryHash(key) || isOperation(key)) continue
    if (key.includes(':')) broad.add(key)
    else nodes.push(key)
  }

  // Leave room for a few skipped:<type> tags
  const budget = Math.max(0, MAX_TAGS - broad.size - 8)
  for (const id of nodes.slice(budget)) {
    const type = nodeType(id)
    broad.add(type ? `skipped:${type}` : 'graphql:Query')
  }

  return [...broad, ...nodes.slice(0, budget)].slice(0, MAX_TAGS)
}

// Root route middleware: runs around the loaders of both page and client
// data (.data) requests, then tags the response for the CDN
export const cacheTagsMiddleware: MiddlewareFunction<Response> = async (
  _,
  next,
) => {
  const { result: response, keys } = await collectGraphqlKeys(() => next())
  const cacheControl = response.headers.get('Cache-Control') ?? ''
  if (keys.size > 0 && cacheControl.includes('public')) {
    const tags = toCacheTags(keys)
    if (tags.length > 0)
      response.headers.set('Vercel-Cache-Tag', tags.join(','))
  }
  // Client data (.data) of prefetched links: let the browser keep it for a
  // few minutes, or every scroll back to a prefetched link fetches it again.
  // Pages themselves stay max-age=0.
  const isData = response.headers
    .get('Content-Type')
    ?.startsWith('text/x-script')
  if (isData && response.status === 200 && cacheControl.includes('max-age=0')) {
    response.headers.set(
      'Cache-Control',
      cacheControl.replace('max-age=0', `max-age=${DATA_BROWSER_MAX_AGE}`),
    )
  }
  return response
}

const DATA_BROWSER_MAX_AGE = 300
