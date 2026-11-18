import { getWpOrigin } from './wp.server'

// WPGraphQL returns at most 100 nodes per query, so `first: skip` can't find
// the cursor of a deep page (from page 12 on, every page showed page 11).
// The REST API takes an offset instead: it gives the id of the item right
// before the page, and a WPGraphQL cursor is just `arrayconnection:<id>`.
// The REST order matches the GraphQL queries (menu order of posts, terms
// and galleries; relevance of search results), checked on 2026-11-18.

const TIMEOUT_MS = 10_000

const toCursor = (id: number) =>
  Buffer.from(`arrayconnection:${id}`).toString('base64')

// Cursor after the first `skip` items of `/wp-json/wp/v2/<type>?<params>`,
// or null when there are no more items than that
export async function cursorAfter(
  type: 'posts' | 'galeria',
  params: Record<string, string>,
  skip: number,
): Promise<string | null> {
  const query = new URLSearchParams({
    ...params,
    offset: String(skip - 1),
    per_page: '1',
    _fields: 'id',
  })
  const response = await fetch(
    `${getWpOrigin()}/wp-json/wp/v2/${type}?${query}`,
    {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  )
  if (!response.ok) {
    throw new Error(`REST offset lookup failed: HTTP ${response.status}`)
  }
  const items = (await response.json()) as { id?: number }[]
  const id = items[0]?.id
  return typeof id === 'number' ? toCursor(id) : null
}

export const MENU_ORDER = { orderby: 'menu_order', order: 'asc' }
