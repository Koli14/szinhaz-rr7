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
import { Pagination } from '~/components/archive/Pagination'

type SearchData = {
  posts: {
    nodes: PostPreview[]
    pageInfo: PageInfo
  }
}

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

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const search = url.searchParams.get('s') ?? ''
  const after = url.searchParams.get('after') ?? undefined

  if (!search.trim()) {
    return { search, posts: [], pageInfo: null, basePath: url.pathname }
  }

  const data = await fetchFromGraphQL<SearchData>(SEARCH_POSTS, {
    search,
    first: PER_PAGE,
    after,
  })

  return {
    search,
    posts: data.posts.nodes,
    pageInfo: data.posts.pageInfo,
    basePath: `${url.pathname}?s=${encodeURIComponent(search)}`,
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
  const { search, posts, pageInfo, basePath } = useLoaderData<typeof loader>()

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
          {pageInfo && <Pagination pageInfo={pageInfo} basePath={basePath} />}
        </>
      )}
    </Box>
  )
}
