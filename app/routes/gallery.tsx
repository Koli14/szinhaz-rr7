import { Box, Grid, Heading } from '@chakra-ui/react'
import { useLoaderData } from 'react-router'
import { Link } from '~/components/Link'
import { PageNav } from '~/components/archive/PageNav'
import { NOT_FOUND_TITLE, PageError } from '~/components/NotFound'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import type { GalleryItem } from '~/types'
import { CACHE, cacheHeaders, permanentRedirect } from '~/utils/cache'
import { responsiveImage } from '~/utils/images'
import { cursorAfter, MENU_ORDER } from '~/utils/offset.server'
import { buildSeoMeta } from '~/utils/seo.server'
import { getSiteOrigin } from '~/utils/wp.server'
import type { Route } from './+types/gallery'

// Three full rows of 4 on desktop (6 of 2 on phones)
const PER_PAGE = 12
// Cards are half of a phone's width and a quarter of the desktop page
const CARD_WIDTHS = [240, 360, 480, 640]
const CARD_SIZES = '(min-width: 62em) 300px, (min-width: 48rem) 33vw, 50vw'
// The first row of cards is on screen when the page opens
const EAGER_CARDS = 4

type GalleriesData = {
  myGalleries: {
    nodes: GalleryItem[]
    pageInfo: { hasNextPage: boolean }
  }
}

const GET_GALLERIES = gql`
  query getGalleries($first: Int!, $after: String) {
    myGalleries(
      first: $first
      after: $after
      where: { orderby: { field: MENU_ORDER, order: ASC } }
    ) {
      pageInfo {
        hasNextPage
      }
      nodes {
        title
        slug
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`

const pageUrl = (page: number) =>
  page === 1 ? '/galeria/' : `/galeria/page/${page}/`

// /galeria/ and /galeria/page/N/, as on the Frontity site
export async function loader({ request, params }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (!pathname.endsWith('/')) throw permanentRedirect(`${pathname}/${search}`)

  const page = params.page === undefined ? 1 : Number(params.page)
  if (!Number.isInteger(page) || page < 1) {
    throw new Response('Not Found', { status: 404 })
  }
  if (page === 1 && params.page !== undefined) {
    throw permanentRedirect('/galeria/')
  }

  let after: string | null = null
  if (page > 1) {
    after = await cursorAfter('galeria', MENU_ORDER, (page - 1) * PER_PAGE)
    if (!after) throw new Response('Not Found', { status: 404 })
  }
  const data = await fetchFromGraphQL<GalleriesData>(GET_GALLERIES, {
    first: PER_PAGE,
    after,
  })
  const { hasNextPage } = data.myGalleries.pageInfo

  const seo = buildSeoMeta(
    request,
    null,
    'Galériák - Színház.online',
    'Színházi fotógalériák: előadások, próbák és események képei a Színház.online-on.',
  )
  const origin = getSiteOrigin(request)
  if (page > 1) {
    seo.push({
      tagName: 'link',
      rel: 'prev',
      href: `${origin}${pageUrl(page - 1)}`,
    })
  }
  if (hasNextPage) {
    seo.push({
      tagName: 'link',
      rel: 'next',
      href: `${origin}${pageUrl(page + 1)}`,
    })
  }

  return { galleries: data.myGalleries.nodes, page, hasNextPage, seo }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: NOT_FOUND_TITLE }]

export const headers = cacheHeaders(CACHE.list)

export default function Gallery() {
  const { galleries, page, hasNextPage } = useLoaderData<typeof loader>()

  return (
    <Box px={{ base: '1rem', lg: '0' }} py='4'>
      <Heading
        as='h1'
        size='lg'
        mb='6'
        textTransform='uppercase'
        fontFamily='heading'
      >
        Galéria
      </Heading>
      {galleries.length === 0 ? (
        <Box color='gray.500' py='8'>
          Nincs galéria.
        </Box>
      ) : (
        <Grid
          templateColumns={{
            base: '1fr 1fr',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          }}
          gap='4'
        >
          {galleries.map((gallery, i) => (
            <GalleryCard
              key={gallery.slug}
              gallery={gallery}
              lazy={i >= EAGER_CARDS}
            />
          ))}
        </Grid>
      )}
      <PageNav
        page={page}
        hasNextPage={hasNextPage}
        pageUrl={pageUrl}
        newerLabel='Újabb galériák'
        olderLabel='Régebbi galériák'
      />
    </Box>
  )
}

function GalleryCard({
  gallery,
  lazy,
}: {
  gallery: GalleryItem
  lazy: boolean
}) {
  const img = gallery.featuredImage?.node
  const sized = img ? responsiveImage(img.sourceUrl, CARD_WIDTHS) : null

  return (
    <Box
      asChild
      display='block'
      borderRadius='md'
      overflow='hidden'
      position='relative'
      _hover={{ opacity: 0.85 }}
      transition='opacity 0.2s'
    >
      <Link to={`/galeria/${gallery.slug}/`}>
        {img && sized ? (
          <Box aspectRatio={4 / 3} overflow='hidden' bg='gray.100'>
            <img
              src={sized.src}
              srcSet={sized.srcSet}
              sizes={CARD_SIZES}
              alt={img.altText || gallery.title}
              loading={lazy ? 'lazy' : undefined}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        ) : (
          <Box aspectRatio={4 / 3} bg='gray.200' />
        )}
        <Box
          position='absolute'
          bottom='0'
          left='0'
          right='0'
          bg='blackAlpha.700'
          color='white'
          px='3'
          py='2'
          fontSize='sm'
          fontFamily='heading'
          lineHeight='tight'
        >
          {gallery.title}
        </Box>
      </Link>
    </Box>
  )
}

export { PageError as ErrorBoundary }
