import { proxyFeed } from '~/utils/feed.server'
import type { Route } from './+types/feed'

// RSS feeds from WordPress, with links pointing at this site and the
// featured images added: the site feed (/feed/, polled by feed readers such
// as mszt.org) and the feeds of categories, tags and folders
// (/category/szinhaz/feed/, /tag/szfe/feed/, /folder/cimlap/feed/).
export function loader({ request }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url)
  return proxyFeed(request, pathname.endsWith('/') ? pathname : `${pathname}/`)
}
