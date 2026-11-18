import { NOT_FOUND_TITLE, PageError } from '~/components/NotFound'
import { CACHE, cacheHeaders } from '~/utils/cache'
import type { Route } from './+types/not-found'

// Any URL no other route matches (/a/b/c/, old /2021/05/31/slug/ links):
// a 404 inside the site layout instead of the bare root error page
export function loader() {
  throw new Response('Not Found', { status: 404 })
}

export const meta: Route.MetaFunction = () => [
  { title: NOT_FOUND_TITLE },
  { name: 'robots', content: 'noindex, follow' },
]

export const headers = cacheHeaders(CACHE.error)

export default function NotFoundRoute() {
  return null
}

export { PageError as ErrorBoundary }
