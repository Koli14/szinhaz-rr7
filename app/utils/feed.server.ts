import { CACHE } from './cache'
import { fetchFromGraphQL, gql } from './graphql.server'
import { escapeXml, proxyWpXml } from './wp.server'

// RSS feeds come from WordPress (the theme's feed template): the site feed
// and the feeds of categories, tags and folders. The template has no
// images, and news aggregators show an item with its picture, so the
// featured images are added here as <enclosure> and <media:content>.

type FeedImages = {
  posts: {
    nodes: {
      databaseId: number
      featuredImage: {
        node: {
          mediaItemUrl: string | null
          mimeType: string | null
          fileSize: number | null
          mediaDetails: { width: number | null; height: number | null } | null
        }
      } | null
    }[]
  }
}

const GET_FEED_IMAGES = gql`
  query getFeedImages($ids: [ID]) {
    posts(first: 100, where: { in: $ids }) {
      nodes {
        databaseId
        featuredImage {
          node {
            mediaItemUrl
            mimeType
            fileSize
            mediaDetails {
              width
              height
            }
          }
        }
      }
    }
  }
`

const ITEM = /<item>[\s\S]*?<\/item>/g
// <guid isPermaLink="false">https://szinhaz.online/?p=123</guid>
const postId = (item: string) =>
  item.match(/<guid[^>]*>[^<]*[?&;]p=(\d+)<\/guid>/)?.[1]

function imageTags(
  image: NonNullable<FeedImages['posts']['nodes'][0]['featuredImage']>,
) {
  const { mediaItemUrl, mimeType, fileSize, mediaDetails } = image.node
  if (!mediaItemUrl) return null
  const url = escapeXml(mediaItemUrl)
  const type = escapeXml(mimeType ?? 'image/jpeg')
  const { width, height } = mediaDetails ?? {}
  const size = width && height ? ` width="${width}" height="${height}"` : ''
  return [
    `\t<enclosure url="${url}" length="${fileSize ?? 0}" type="${type}" />`,
    `\t\t<media:content url="${url}" medium="image" type="${type}"${size} />`,
    '\t',
  ].join('\n')
}

// A feed without images is better than no feed: on any error it stays as is
async function addFeaturedImages(xml: string) {
  const ids = [
    ...new Set([...xml.matchAll(ITEM)].map(([item]) => postId(item))),
  ].filter((id) => id !== undefined)
  if (!ids.length) return xml

  const tags = new Map<string, string>()
  try {
    const data = await fetchFromGraphQL<FeedImages>(GET_FEED_IMAGES, { ids })
    for (const post of data.posts.nodes) {
      const image = post.featuredImage && imageTags(post.featuredImage)
      if (image) tags.set(String(post.databaseId), image)
    }
  } catch (e) {
    console.error('Feed images failed:', e)
    return xml
  }
  if (!tags.size) return xml

  return xml
    .replace(
      /<rss\b(?![^>]*xmlns:media=)/,
      '<rss xmlns:media="http://search.yahoo.com/mrss/"',
    )
    .replace(ITEM, (item) => {
      const image = tags.get(postId(item) ?? '')
      return image ? item.replace('</item>', `${image}</item>`) : item
    })
}

// `path` is the feed's WordPress path: /feed/, /category/szinhaz/feed/, …
export function proxyFeed(request: Request, path: string) {
  return proxyWpXml(request, path, {
    cacheControl: CACHE.feed,
    transform: addFeaturedImages,
  })
}
