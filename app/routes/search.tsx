import { Box, Heading } from '@chakra-ui/react'
import { useLoaderData } from 'react-router'
import { ArchiveItem } from '~/components/archive/ArchiveItem'
import {
  fetchFromGraphQL,
  gql,
  POST_PREVIEW_FIELDS,
} from '~/utils/graphql.server'
import { CACHE, cacheHeaders } from '~/utils/cache'
import type { PostPreview, PageInfo } from '~/types'
import { POSTS_PER_PAGE as PER_PAGE } from '~/types'
import type { Route } from './+types/search'
import { PageNav } from '~/components/archive/PageNav'

type SearchData = {
  posts: {
    nodes: PostPreview[]
    pageInfo: PageInfo
  }
}

type CursorData = { posts: { pageInfo: { endCursor: string | null } } }

// Like the archives: numbered pages, but no crawling of deep result pages
const MAX_PAGE = 50

const SEARCH_CURSOR = gql`
  query searchCursor($search: String!, $skip: Int!) {
    posts(first: $skip, where: { search: $search }) {
      pageInfo {
        endCursor
      }
    }
  }
`

const SEARCH_POSTS = gql`
  query searchPosts($search: String!, $first: Int!, $after: String) {
    posts(first: $first, after: $after, where: { search: $search }) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      nodes {
        ${POST_PREVIEW_FIELDS}
      }
    }
  }
`

const empty = (search: string, page = 1) => ({
  search,
  posts: [] as PostPreview[],
  page,
  hasNextPage: false,
})

// /search?s=alma&page=2 — results in WordPress' relevance order
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const search = (url.searchParams.get('s') ?? '').trim()
  const page = Number(url.searchParams.get('page') ?? '1')

  if (!search) return empty(search)
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new Response('Not Found', { status: 404 })
  }

  let after: string | null = null
  if (page > 1) {
    const cursor = await fetchFromGraphQL<CursorData>(SEARCH_CURSOR, {
      search,
      skip: (page - 1) * PER_PAGE,
    })
    after = cursor.posts.pageInfo.endCursor
    if (!after) return empty(search, page)
  }

  const data = await fetchFromGraphQL<SearchData>(SEARCH_POSTS, {
    search,
    first: PER_PAGE,
    after,
  })

  return {
    search,
    posts: data.posts.nodes,
    page,
    hasNextPage: data.posts.pageInfo.hasNextPage,
  }
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.search
    ? `„${data.search}” keresési eredmények | Színház.online`
    : 'Keresés | Színház.online'
  return [{ title }, { name: 'robots', content: 'noindex, follow' }]
}

export const headers = cacheHeaders(CACHE.list)

export default function Search() {
  const { search, posts, page, hasNextPage } = useLoaderData<typeof loader>()

  return (
    <Box px={{ base: '1rem', lg: '0' }} py='4'>
      <Heading
        as='h1'
        size='lg'
        mb='6'
        textTransform='uppercase'
        fontFamily='heading'
      >
        {search ? `Keresés: „${search}"` : 'Keresés'}
      </Heading>
      {posts.length === 0 ? (
        <Box color='gray.500' py='8'>
          {search
            ? 'Nem találtunk cikket erre a keresési kifejezésre.'
            : 'Adjon meg egy keresési kifejezést.'}
        </Box>
      ) : (
        <>
          <Box>
            {posts.map((post, i) => (
              <ArchiveItem key={post.slug} item={post} featured={i === 0} />
            ))}
          </Box>
          <PageNav
            page={page}
            hasNextPage={hasNextPage}
            pageUrl={(n) =>
              `/search?s=${encodeURIComponent(search)}${n > 1 ? `&page=${n}` : ''}`
            }
          />
        </>
      )}
    </Box>
  )
}
