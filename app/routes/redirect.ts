import { getWpOrigin } from '~/utils/wp.server'
import { permanentRedirect } from '~/utils/cache'
import type { Route } from './+types/redirect'

// Permanent redirects for URLs that changed or are aliases:
// - /kezdooldal/ is the WordPress front page
// - /tags/x was an early RR7 URL
// - /post-slug/2/ is WordPress' paged post URL, still linked from outside
// - /wp-content/… files on this domain (old links): they live on WordPress
// - /page/N/ was Frontity's paged post list, now /hirek/page/N/
// - /2022/01/ was a Frontity month archive: rr7 has none, so it is a 404
//   (a paged post URL never has a leading zero)
export function loader({ request, params }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (pathname.startsWith('/wp-content/')) {
    throw permanentRedirect(`${getWpOrigin()}${pathname}${search}`)
  }
  if (pathname.startsWith('/tags/') && params.slug) {
    throw permanentRedirect(`/tag/${params.slug}/`)
  }
  if (params.page !== undefined) {
    const isMonthArchive =
      /^\d{4}$/.test(params.slug ?? '') &&
      /^(0[1-9]|1[0-2])$/.test(params.page)
    if (!/^\d+$/.test(params.page) || isMonthArchive) {
      throw new Response('Not Found', { status: 404 })
    }
    if (params.slug === 'page') {
      throw permanentRedirect(`/hirek/page/${params.page}/`)
    }
    throw permanentRedirect(`/${params.slug}/`)
  }
  throw permanentRedirect('/')
}
