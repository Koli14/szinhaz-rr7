import { CACHE } from '~/utils/cache'
import { getSiteOrigin, isIndexable } from '~/utils/wp.server'
import type { Route } from './+types/robots'

export function loader({ request }: Route.LoaderArgs) {
  const origin = getSiteOrigin(request)
  const body = isIndexable()
    ? [
        `Sitemap: ${origin}/sitemap_index.xml`,
        `Sitemap: ${origin}/news-sitemap.xml`,
        '',
        // Every crawler is welcome: search engines, AI assistants, ad tech
        // and SEO tools alike (the owner's decision, 2026-11-24)
        'User-agent: *',
        'Disallow:',
        '',
      ]
    : ['# Teszt környezet, nem indexelhető', 'User-agent: *', 'Disallow: /', '']

  return new Response(body.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': CACHE.xml,
    },
  })
}
