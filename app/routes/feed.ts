import { CACHE } from '~/utils/cache'
import { proxyWpXml } from '~/utils/wp.server'
import type { Route } from './+types/feed'

// RSS feed from WordPress (the theme's custom feed template), with links
// pointing at this site. Feed readers such as mszt.org poll this URL.
export function loader({ request }: Route.LoaderArgs) {
  return proxyWpXml(request, '/feed/', { cacheControl: CACHE.feed })
}
