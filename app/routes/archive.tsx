import { Box, Heading } from '@chakra-ui/react'
import { redirect, useLoaderData } from 'react-router'
import { ArchiveItem } from '~/components/archive/ArchiveItem'
import { PageNav } from '~/components/archive/PageNav'
import { loadArchive, splitPagedPath } from '~/utils/archive.server'
import { CACHE, cacheHeaders } from '~/utils/cache'
import type { Route } from './+types/archive'

// Serves /category/…/, /tag/…/, /folder/…/ and the posts page (/hirek/),
// each with WordPress-style /page/N/ pagination.
export async function loader({ request }: Route.LoaderArgs) {
  const { pathname, search, searchParams } = new URL(request.url)
  if (!pathname.endsWith('/')) throw redirect(`${pathname}/${search}`, 301)

  const { uri, page } = splitPagedPath(pathname)

  // Frontity searched on the posts page: /hirek/?s=… and /hirek/page/N/?s=…
  const s = searchParams.get('s')
  if (s !== null && uri === '/hirek/') {
    const paged = page > 1 ? `&page=${page}` : ''
    throw redirect(`/search?s=${encodeURIComponent(s)}${paged}`, 301)
  }
  if (page === 1 && uri !== pathname) throw redirect(uri, 301)

  return loadArchive(request, uri, page)
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Az oldal nem található | Színház.online' }]

export const headers = cacheHeaders(CACHE.list)

const pageUrl = (basePath: string, page: number) =>
  page === 1 ? basePath : `${basePath}page/${page}/`

export default function Archive() {
  const { name, posts, page, hasNextPage, basePath } =
    useLoaderData<typeof loader>()

  return (
    <Box py='4'>
      {/* Frontity showed no title; keep it for screen readers and SEO */}
      <Heading as='h1' srOnly dangerouslySetInnerHTML={{ __html: name }} />
      <Box>
        {posts.map((post, i) => (
          <ArchiveItem key={post.slug} item={post} featured={i === 0} />
        ))}
      </Box>
      <PageNav
        page={page}
        hasNextPage={hasNextPage}
        pageUrl={(n) => pageUrl(basePath, n)}
      />
    </Box>
  )
}

export function ErrorBoundary() {
  return (
    <Box px={{ base: '1rem', lg: '0' }} py='8'>
      <p>Az oldal nem található.</p>
    </Box>
  )
}
