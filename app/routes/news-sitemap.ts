import { CACHE } from '~/utils/cache'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import { decodeEntities } from '~/utils/seo.server'
import { escapeXml, getSiteOrigin, isIndexable } from '~/utils/wp.server'
import type { Route } from './+types/news-sitemap'

// Google News sitemap: the posts of the last two days, which is all Google
// reads from it. It gets new articles into Google News and Top stories
// faster than the 32 Yoast post sitemaps (Yoast only has it in a paid
// add-on). Publishing a post invalidates it on the CDN, like every list.

const PUBLICATION = 'Színház.online'
const LANGUAGE = 'hu'
const MAX_AGE_MS = 48 * 60 * 60 * 1000

type NewsData = {
  posts: { nodes: { uri: string; title: string | null; dateGmt: string }[] }
}

// The date filter is by day (in site time), so it starts a day early and
// the exact 48 hours are cut below. ~15 posts a day: 100 is plenty.
const GET_NEWS = gql`
  query getNewsSitemap($after: DateInput) {
    posts(
      first: 100
      where: {
        dateQuery: { after: $after, inclusive: true }
        orderby: { field: DATE, order: DESC }
      }
    ) {
      nodes {
        uri
        title
        dateGmt
      }
    }
  }
`

export async function loader({ request }: Route.LoaderArgs) {
  const origin = getSiteOrigin(request)
  const now = Date.now()
  const from = new Date(now - MAX_AGE_MS - 24 * 60 * 60 * 1000)
  const data = await fetchFromGraphQL<NewsData>(GET_NEWS, {
    after: {
      year: from.getUTCFullYear(),
      month: from.getUTCMonth() + 1,
      day: from.getUTCDate(),
    },
  })

  const urls = data.posts.nodes
    .map((post) => ({ ...post, time: Date.parse(`${post.dateGmt}Z`) }))
    .filter((post) => post.time <= now && now - post.time <= MAX_AGE_MS)
    .map((post) =>
      [
        '\t<url>',
        `\t\t<loc>${escapeXml(`${origin}${post.uri}`)}</loc>`,
        '\t\t<news:news>',
        '\t\t\t<news:publication>',
        `\t\t\t\t<news:name>${PUBLICATION}</news:name>`,
        `\t\t\t\t<news:language>${LANGUAGE}</news:language>`,
        '\t\t\t</news:publication>',
        `\t\t\t<news:publication_date>${post.dateGmt}+00:00</news:publication_date>`,
        `\t\t\t<news:title>${escapeXml(decodeEntities(post.title ?? ''))}</news:title>`,
        '\t\t</news:news>',
        '\t</url>',
      ].join('\n'),
    )

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      'Cache-Control': CACHE.feed,
      ...(isIndexable() ? {} : { 'X-Robots-Tag': 'noindex' }),
    },
  })
}
