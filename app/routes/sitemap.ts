import { redirect } from 'react-router'
import { CACHE } from '~/utils/cache'
import { proxyWpXml } from '~/utils/wp.server'
import type { Route } from './+types/sitemap'

// Yoast sitemaps (index, per-type pages and the XSL stylesheet) proxied from
// WordPress with the page URLs rewritten to this site.
export function loader({ request }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url)

  // Old core sitemap URLs (the Frontity robots.txt pointed to wp-sitemap.xml)
  if (pathname === '/sitemap.xml' || pathname.startsWith('/wp-sitemap')) {
    throw redirect('/sitemap_index.xml', 301)
  }

  return proxyWpXml(request, pathname, { cacheControl: CACHE.xml })
}
