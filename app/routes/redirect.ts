import { getWpOrigin } from '~/utils/wp.server'
import { permanentRedirect } from '~/utils/cache'
import type { Route } from './+types/redirect'

// Permanent redirects for URLs that changed or are aliases:
// - /kezdooldal/ is the WordPress front page
// - /tags/x was an early RR7 URL
// - /post-slug/2/ is WordPress' paged post URL, still linked from outside
// - /wp-content/… files on this domain (old links): they live on WordPress
export function loader({ request, params }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (pathname.startsWith('/wp-content/')) {
    throw permanentRedirect(`${getWpOrigin()}${pathname}${search}`)
  }
  if (pathname.startsWith('/tags/') && params.slug) {
    throw permanentRedirect(`/tag/${params.slug}/`)
  }
  if (params.page !== undefined) {
    if (!/^\d+$/.test(params.page)) {
      throw new Response('Not Found', { status: 404 })
    }
    throw permanentRedirect(`/${params.slug}/`)
  }
  throw permanentRedirect('/')
}
