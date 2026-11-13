import { fetchFromGraphQL, gql } from './graphql.server'
import { isIndexable } from './wp.server'

// IndexNow tells search engines right away that a post was published or
// changed: Bing (and what runs on its index: Copilot, DuckDuckGo, partly
// ChatGPT search), Seznam, Naver, Yandex. Google does not take part.
// The key is public by design: it is served from /<key>.txt (public/) to
// prove that the caller owns the site.
export const INDEXNOW_KEY = '7f7fae5d063f566244cdf52c3d881554'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS = 100

type PostUris = { posts: { nodes: { uri: string }[] } }

// Only published posts come back, so drafts, pages, images and deleted
// posts drop out here
const GET_URIS = gql`
  query getIndexNowUris($ids: [ID]) {
    posts(first: 100, where: { in: $ids }) {
      nodes {
        uri
      }
    }
  }
`

// Cache tag of a changed post, `cG9zdDoxMjM=` (post:123) → `123`
function postId(tag: string) {
  const [type, id] = Buffer.from(tag, 'base64').toString('utf8').split(':')
  return type === 'post' && /^\d+$/.test(id ?? '') ? id : null
}

// Called with the cache tags WordPress has just invalidated. Never throws:
// a failed ping must not fail the invalidation.
export async function submitToIndexNow(tags: string[]) {
  const origin = process.env.SITE_URL?.replace(/\/$/, '')
  // Test deployments must not announce their URLs
  if (!isIndexable() || !origin) return
  const ids = [...new Set(tags.map(postId))]
    .filter((id) => id !== null)
    .slice(0, MAX_URLS)
  if (!ids.length) return

  try {
    const data = await fetchFromGraphQL<PostUris>(GET_URIS, { ids })
    const urlList = data.posts.nodes.map((post) => `${origin}${post.uri}`)
    if (!urlList.length) return
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(origin).host,
        key: INDEXNOW_KEY,
        keyLocation: `${origin}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      console.error(
        `IndexNow answered ${response.status} for ${urlList.length} URLs`,
      )
    }
  } catch (e) {
    console.error('IndexNow failed:', e)
  }
}
