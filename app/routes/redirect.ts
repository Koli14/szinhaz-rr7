import { redirect } from 'react-router'
import type { Route } from './+types/redirect'

// Permanent redirects for URLs that changed or are aliases:
// /kezdooldal/ is the WordPress front page, /tags/x was an early RR7 URL.
export function loader({ request, params }: Route.LoaderArgs) {
  const { pathname } = new URL(request.url)
  if (pathname.startsWith('/tags/') && params.slug) {
    throw redirect(`/tag/${params.slug}/`, 301)
  }
  throw redirect('/', 301)
}
