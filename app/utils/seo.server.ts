import type { MetaDescriptor } from 'react-router'
import { getSiteOrigin, isIndexable, rewriteBackendUrls } from './wp.server'

// GraphQL fragment for the Yoast head provided by the "Add WPGraphQL SEO"
// plugin. Available on posts, pages, terms and content types.
export const SEO_FIELDS = `seo { fullHead }`

export type Seo = { fullHead: string | null } | null | undefined

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {}
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[m[1]] = decodeEntities(m[2])
  }
  return attrs
}

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

// Turns Yoast's `fullHead` HTML into React Router meta descriptors, with
// backend URLs (canonical, og:url, JSON-LD ids) pointing at this site.
export function buildSeoMeta(
  request: Request,
  seo: Seo,
  fallbackTitle = 'Színház.online',
): MetaDescriptor[] {
  const origin = getSiteOrigin(request)
  const head = rewriteBackendUrls(seo?.fullHead ?? '', origin)
  const meta: MetaDescriptor[] = []

  const title = head.match(/<title>([\s\S]*?)<\/title>/)?.[1]
  meta.push({ title: title ? decodeEntities(title) : fallbackTitle })

  for (const [tag] of head.matchAll(/<meta\s[^>]*>/g)) {
    const a = parseAttributes(tag)
    if (a.name === 'robots' && !isIndexable()) continue
    if (a.name && a.content !== undefined)
      meta.push({ name: a.name, content: a.content })
    else if (a.property && a.content !== undefined)
      meta.push({ property: a.property, content: a.content })
  }

  // Yoast has no description for most archives: use the site tagline, as
  // the Frontity site did
  if (!meta.some((m) => 'name' in m && m.name === 'description')) {
    meta.push({ name: 'description', content: 'A színházi világ hírei' })
  }

  let hasCanonical = false
  for (const [tag] of head.matchAll(/<link\s[^>]*>/g)) {
    const a = parseAttributes(tag)
    if (!a.rel || !a.href) continue
    if (a.rel === 'canonical') hasCanonical = true
    meta.push({ tagName: 'link', rel: a.rel, href: a.href })
  }

  // Yoast leaves the canonical out while the backend is set to noindex
  if (!hasCanonical) {
    const path = new URL(request.url).pathname.replace(/\/page\/1\/?$/, '/')
    meta.push({ tagName: 'link', rel: 'canonical', href: `${origin}${path}` })
  }

  for (const m of head.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      meta.push({ 'script:ld+json': JSON.parse(m[1]) })
    } catch {
      // skip invalid JSON-LD instead of failing the page
    }
  }

  if (!isIndexable())
    meta.push({ name: 'robots', content: 'noindex, nofollow' })

  return meta
}
