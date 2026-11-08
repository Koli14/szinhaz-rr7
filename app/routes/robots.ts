import { CACHE } from '~/utils/cache'
import { getSiteOrigin, isIndexable } from '~/utils/wp.server'
import type { Route } from './+types/robots'

// SEO tools and crawlers that bring no visitors, only function time
// (same list as the Frontity site's robots.txt)
const BLOCKED_BOTS = [
  'AhrefsBot',
  'DotBot',
  'Barkrowler',
  'Baiduspider',
  'SemrushBot',
  'MJ12bot',
  'BLEXBot',
  'PetalBot',
  'YandexBot',
  'proximic',
  'SirdataBot',
]

export function loader({ request }: Route.LoaderArgs) {
  const origin = getSiteOrigin(request)
  const body = isIndexable()
    ? [
        `Sitemap: ${origin}/sitemap_index.xml`,
        '',
        '# SEO-eszközök és irreleváns keresők: nem hoznak forgalmat, csak function-időt égetnek',
        ...BLOCKED_BOTS.map((bot) => `User-agent: ${bot}`),
        'Disallow: /',
        '',
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
