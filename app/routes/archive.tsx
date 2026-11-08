import { Box, Heading } from '@chakra-ui/react'
import { Link, redirect, useLoaderData } from 'react-router'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { ArchiveItem } from '~/components/archive/ArchiveItem'
import { loadArchive, splitPagedPath } from '~/utils/archive.server'
import { CACHE, cacheHeaders } from '~/utils/cache'
import type { Route } from './+types/archive'

// Serves /category/…/, /tag/…/, /folder/…/ and the posts page (/hirek/),
// each with WordPress-style /page/N/ pagination.
export async function loader({ request }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (!pathname.endsWith('/')) throw redirect(`${pathname}/${search}`, 301)

  const { uri, page } = splitPagedPath(pathname)
  if (page === 1 && uri !== pathname) throw redirect(uri, 301)

  return loadArchive(request, uri, page)
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Az oldal nem található | Színház.online' }]

export const headers = cacheHeaders(CACHE.list)

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  minHeight: '52px',
  background: '#F4A91C',
  color: 'white',
  textTransform: 'uppercase',
  fontSize: '1rem',
  textDecoration: 'none',
}

const pageUrl = (basePath: string, page: number) =>
  page === 1 ? basePath : `${basePath}page/${page}/`

export default function Archive() {
  const { name, posts, page, hasNextPage, basePath } =
    useLoaderData<typeof loader>()

  return (
    <Box px={{ base: '1rem', lg: '0' }} py='4'>
      <Heading
        as='h1'
        size='lg'
        mb='6'
        textTransform='uppercase'
        fontFamily='heading'
        dangerouslySetInnerHTML={{ __html: name }}
      />
      <Box>
        {posts.map((post, i) => (
          <ArchiveItem
            key={post.slug}
            item={post}
            featured={page === 1 && i === 0}
          />
        ))}
      </Box>
      <Box display='flex' mt='56px' justifyContent='center' gap='4'>
        {page > 1 && (
          <Link to={pageUrl(basePath, page - 1)} style={buttonStyle}>
            <Box as={BsChevronLeft} mr='2' />
            Újabb hírek
          </Link>
        )}
        {hasNextPage && (
          <Link to={pageUrl(basePath, page + 1)} style={buttonStyle}>
            Régebbi hírek
            <Box as={BsChevronRight} ml='2' />
          </Link>
        )}
      </Box>
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
