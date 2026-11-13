import type { MetaDescriptor } from 'react-router'
import { getSiteOrigin, isIndexable, rewriteBackendUrls } from './wp.server'

// GraphQL fragment for the Yoast head provided by the "Add WPGraphQL SEO"
// plugin. Available on posts, pages, terms and content types. The head has
// no robots meta (Yoast only prints it for REST requests, WordPress itself
// prints it on a normal site), so the index/follow settings come as fields.
export const SEO_FIELDS = `seo { fullHead metaRobotsNoindex metaRobotsNofollow }`

export type Seo =
  | {
      fullHead: string | null
      metaRobotsNoindex?: string | null
      metaRobotsNofollow?: string | null
    }
  | null
  | undefined

const SITE_SUFFIX = ' - Színház.online'
const DEFAULT_DESCRIPTION = 'A színházi világ hírei'

// What Yoast prints on a WordPress site. `max-image-preview:large` lets
// Google Discover (the site's biggest traffic source) show the lead image as
// a large card instead of a thumbnail.
const ROBOTS_PREVIEW =
  'max-snippet:-1, max-image-preview:large, max-video-preview:-1'

function robotsContent(seo: Seo) {
  const follow = seo?.metaRobotsNofollow === 'nofollow' ? 'nofollow' : 'follow'
  if (seo?.metaRobotsNoindex === 'noindex') return `noindex, ${follow}`
  return `index, ${follow}, ${ROBOTS_PREVIEW}`
}

// The bylines that may appear in the head. WordPress user names must not get
// out (a display name defaults to the login name): anything that is not on
// the list becomes the first name.
const AUTHORS = ['Tóth Berta', 'Vass Kata']
const publicAuthor = (name: unknown) =>
  typeof name === 'string' && AUTHORS.includes(name) ? name : AUTHORS[0]

type JsonLdNode = Record<string, unknown>

const hasType = (node: JsonLdNode, type: string) =>
  ([] as unknown[]).concat(node['@type'] ?? []).includes(type)

// Persons keep their name only: no Gravatar (a hash of the e-mail address)
// and no profile links
function cleanAuthors(data: unknown) {
  const graph = (data as { '@graph'?: unknown } | null)?.['@graph']
  if (!Array.isArray(graph)) return data
  return {
    ...(data as JsonLdNode),
    '@graph': graph.map((node: JsonLdNode) => {
      if (hasType(node, 'Person')) {
        return {
          '@type': 'Person',
          '@id': node['@id'],
          name: publicAuthor(node.name),
        }
      }
      const author = node.author as JsonLdNode | undefined
      if (author && typeof author === 'object' && 'name' in author) {
        return {
          ...node,
          author: { ...author, name: publicAuthor(author.name) },
        }
      }
      return node
    }),
  }
}

function parseAttributes(tag: string) {
  const attrs: Record<string, string> = {}
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[m[1]] = decodeEntities(m[2])
  }
  return attrs
}

export function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

// Turns Yoast's `fullHead` HTML into React Router meta descriptors, with
// backend URLs (canonical, og:url, JSON-LD ids) pointing at this site.
export function buildSeoMeta(
  request: Request,
  seo: Seo,
  fallbackTitle = 'Színház.online',
  fallbackDescription = DEFAULT_DESCRIPTION,
): MetaDescriptor[] {
  const origin = getSiteOrigin(request)
  const head = rewriteBackendUrls(seo?.fullHead ?? '', origin)
  const meta: MetaDescriptor[] = []
  const path = new URL(request.url).pathname.replace(/\/page\/1\/?$/, '/')
  // Archive pages 2, 3, …: Yoast's head is the archive's own, pointing at
  // page 1. Paginated pages must point at themselves, or search engines
  // treat them as duplicates of page 1 and skip the older posts.
  const page = Number(path.match(/\/page\/(\d+)\/?$/)?.[1] ?? 1)
  const pagedUrl = page > 1 ? `${origin}${path}` : null
  // "Cirkusz – hírek, cikkek – 2. oldal - Színház.online"
  const pagedTitle = (title: string) => {
    if (page <= 1) return title
    const label = ` – ${page}. oldal`
    return title.endsWith(SITE_SUFFIX)
      ? `${title.slice(0, -SITE_SUFFIX.length)}${label}${SITE_SUFFIX}`
      : `${title}${label}`
  }
  const pagedText = (text: string) =>
    page > 1 ? `${text.replace(/\.$/, '')} – ${page}. oldal` : text

  const title = head.match(/<title>([\s\S]*?)<\/title>/)?.[1]
  meta.push({
    title: pagedTitle(title ? decodeEntities(title) : fallbackTitle),
  })

  // Yoast's "Szerző:" label comes right before its value
  let isAuthorLabel = false
  for (const [tag] of head.matchAll(/<meta\s[^>]*>/g)) {
    const a = parseAttributes(tag)
    if (a.content === undefined) continue
    let content = a.content
    if (a.name) {
      // Set below, from the index/follow fields
      if (a.name === 'robots') continue
      if (a.name === 'author') content = publicAuthor(content)
      if (a.name === 'twitter:label1') {
        isAuthorLabel = /szerző|written by/i.test(content)
      }
      if (a.name === 'twitter:data1' && isAuthorLabel) {
        content = publicAuthor(content)
      }
      if (a.name === 'description') content = pagedText(content)
      meta.push({ name: a.name, content })
    } else if (a.property) {
      if (a.property === 'og:url' && pagedUrl) content = pagedUrl
      if (a.property === 'og:title') content = pagedTitle(content)
      if (a.property === 'og:description') content = pagedText(content)
      meta.push({ property: a.property, content })
    }
  }

  // Yoast has a description only where a template or the editor gave one
  if (!meta.some((m) => 'name' in m && m.name === 'description')) {
    meta.push({ name: 'description', content: pagedText(fallbackDescription) })
  }

  let hasCanonical = false
  for (const [tag] of head.matchAll(/<link\s[^>]*>/g)) {
    const a = parseAttributes(tag)
    if (!a.rel || !a.href) continue
    // Yoast's next/prev are those of page 1, and for posts with page breaks
    // they point at /post/2/, which this site shows on one page. Archives
    // add their own (archive.server.ts).
    if (a.rel === 'next' || a.rel === 'prev') continue
    if (a.rel === 'canonical') hasCanonical = true
    const href = a.rel === 'canonical' && pagedUrl ? pagedUrl : a.href
    meta.push({ tagName: 'link', rel: a.rel, href })
  }

  // Yoast leaves the canonical out while the backend is set to noindex
  if (!hasCanonical) {
    meta.push({ tagName: 'link', rel: 'canonical', href: `${origin}${path}` })
  }

  for (const m of head.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      meta.push({ 'script:ld+json': cleanAuthors(JSON.parse(m[1])) })
    } catch {
      // skip invalid JSON-LD instead of failing the page
    }
  }

  meta.push({
    name: 'robots',
    content: isIndexable() ? robotsContent(seo) : 'noindex, nofollow',
  })

  return meta
}
