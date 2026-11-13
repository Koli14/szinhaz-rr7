import { createHash, timingSafeEqual } from 'node:crypto'
import { invalidateByTag, waitUntil } from '@vercel/functions'
import { CACHE } from '~/utils/cache'
import { isValidTag } from '~/utils/cacheTags.server'
import { submitToIndexNow } from '~/utils/indexnow.server'
import type { Route } from './+types/revalidate'

// Called by WordPress (mu-plugin szinhaz-vercel-purge.php) with the WPGraphQL
// Smart Cache keys of changed content:
//   POST /api/revalidate  Authorization: Bearer <REVALIDATE_SECRET>
//   { "tags": ["cG9zdDoxMjM=", "list:post"] }
// Marks the pages tagged with them stale on the Vercel CDN, then tells
// search engines about the changed posts (IndexNow).

const MAX_TAGS_PER_REQUEST = 1000
// The REST API takes at most 16 tags per call; stay within that here too
const CHUNK = 16

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': CACHE.none } })

const digest = (value: string) => createHash('sha256').update(value).digest()

function isAuthorized(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false
  const given = request.headers.get('Authorization') ?? ''
  return timingSafeEqual(digest(given), digest(`Bearer ${secret}`))
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST')
    return json({ error: 'Method not allowed' }, 405)
  if (!isAuthorized(request)) return json({ error: 'Unauthorized' }, 401)

  const body = (await request.json().catch(() => null)) as {
    tags?: unknown
  } | null
  const tags = Array.isArray(body?.tags)
    ? [...new Set(body.tags.filter(isValidTag))]
    : []
  if (tags.length === 0) return json({ error: 'No valid tags' }, 400)
  if (tags.length > MAX_TAGS_PER_REQUEST) {
    return json({ error: `At most ${MAX_TAGS_PER_REQUEST} tags` }, 400)
  }

  for (let i = 0; i < tags.length; i += CHUNK) {
    await invalidateByTag(tags.slice(i, i + CHUNK))
  }
  // After the response: WordPress should not wait for it
  waitUntil(submitToIndexNow(tags))
  return json({ invalidated: tags.length })
}

export function loader() {
  return json({ error: 'Method not allowed' }, 405)
}
