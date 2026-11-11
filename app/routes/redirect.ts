import { redirect } from 'react-router'
import { getWpOrigin } from '~/utils/wp.server'
import type { Route } from './+types/redirect'

// Permanent redirects for URLs that changed or are aliases:
// - /kezdooldal/ is the WordPress front page
// - /tags/x was an early RR7 URL
// - /post-slug/2/ is WordPress' paged post URL, still linked from outside
// - /wp-content/… files on this domain (old links): they live on WordPress
export function loader({ request, params }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (pathname.startsWith('/wp-content/')) {
    throw redirect(`${getWpOrigin()}${pathname}${search}`, 301)
  }
  if (pathname.startsWith('/tags/') && params.slug) {
    throw redirect(`/tag/${params.slug}/`, 301)
  }
  if (params.page !== undefined) {
    if (!/^\d+$/.test(params.page)) {
      throw new Response('Not Found', { status: 404 })
    }
    throw redirect(`/${params.slug}/`, 301)
  }
  throw redirect('/', 301)
}
