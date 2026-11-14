// Helpers for talking to the headless WordPress backend and for turning
// backend URLs into frontend URLs.

export function getGraphqlEndpoint() {
  const endpoint = process.env.GRAPHQL_API
  if (!endpoint) throw new Error('GRAPHQL_API env var is required')
  return endpoint
}

// https://wp.szinhaz.online
export function getWpOrigin() {
  return new URL(getGraphqlEndpoint()).origin
}

// The public origin of this frontend. SITE_URL pins it (e.g. the production
// domain), otherwise the origin of the incoming request is used.
export function getSiteOrigin(request: Request) {
  return (process.env.SITE_URL || new URL(request.url).origin).replace(
    /\/$/,
    '',
  )
}

// Only the production deployment may be indexed. Previews and test
// deployments answer with noindex so they never compete with szinhaz.online.
export function isIndexable() {
  return process.env.SITE_INDEXABLE === 'true'
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Hosts whose page links should point at this frontend. Uploads, plugin
// assets and the API stay on WordPress.
function backendHosts() {
  const hosts = new Set([new URL(getWpOrigin()).host, 'wp.szinhaz.online'])
  return [...hosts].map(escapeRegExp).join('|')
}

// Works for both `wp-content/` and the JSON-escaped `wp-content\/`
const KEEP_ON_BACKEND = '(?!wp-content|wp-includes|wp-json|wp-admin|graphql)'

// Rewrites absolute backend page URLs (plain and JSON-escaped) to `origin`.
export function rewriteBackendUrls(text: string, origin: string) {
  const hosts = backendHosts()
  const plain = new RegExp(`https?://(?:${hosts})/${KEEP_ON_BACKEND}`, 'g')
  const protocolRelative = new RegExp(
    `(["'])//(?:${hosts})/${KEEP_ON_BACKEND}`,
    'g',
  )
  const escaped = new RegExp(
    `https?:\\\\/\\\\/(?:${hosts})\\\\/${KEEP_ON_BACKEND}`,
    'g',
  )
  const escapedOrigin = origin.replace(/\//g, '\\/')
  return text
    .replace(plain, `${origin}/`)
    .replace(protocolRelative, `$1${origin}/`)
    .replace(escaped, `${escapedOrigin}\\/`)
    .replace(new RegExp(`https?://(?:${hosts})(?=["'<\\s])`, 'g'), origin)
}

// Makes links inside post HTML relative so client-side navigation keeps
// working on every deployment (preview, test and production domains).
export function relativizeContentLinks(html: string) {
  const hosts = [backendHosts(), 'szinhaz\\.online'].join('|')
  return html.replace(
    new RegExp(`href=(["'])https?://(?:${hosts})/${KEEP_ON_BACKEND}`, 'g'),
    'href=$1/',
  )
}

export const escapeXml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Fetches a path from WordPress and returns it with backend URLs rewritten to
// this site. Used for the sitemaps, the XSL stylesheet and the RSS feeds.
// `transform` can change the rewritten XML before it is sent.
export async function proxyWpXml(
  request: Request,
  path: string,
  {
    cacheControl,
    transform,
  }: {
    cacheControl: string
    transform?: (xml: string) => string | Promise<string>
  },
) {
  const upstream = await fetch(`${getWpOrigin()}${path}`, {
    headers: { 'User-Agent': 'szinhaz-rr7 (+https://szinhaz.online)' },
    redirect: 'manual',
  })

  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get('location')
    if (location) {
      const target = rewriteBackendUrls(location, getSiteOrigin(request))
      return new Response(null, { status: 301, headers: { Location: target } })
    }
  }

  if (!upstream.ok) {
    return new Response('Not Found', {
      status: upstream.status === 404 ? 404 : 502,
      headers: { 'Cache-Control': 'public, s-maxage=60' },
    })
  }

  const origin = getSiteOrigin(request)
  const xml = rewriteBackendUrls(await upstream.text(), origin).replace(
    /\/\/[^"']+\/wp-content\/plugins\/wordpress-seo\/css\/main-sitemap\.xsl/g,
    `${origin}/main-sitemap.xsl`,
  )
  const body = transform ? await transform(xml) : xml

  return new Response(body, {
    headers: {
      'Content-Type':
        upstream.headers.get('content-type') ?? 'text/xml; charset=UTF-8',
      'Cache-Control': cacheControl,
      ...(isIndexable() ? {} : { 'X-Robots-Tag': 'noindex' }),
    },
  })
}
