import { Box, Grid, Heading } from '@chakra-ui/react'
import { useLoaderData } from 'react-router'
import { Link } from '~/components/Link'
import { Pagination } from '~/components/archive/Pagination'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import { POSTS_PER_PAGE as PER_PAGE } from '~/types'
import type { GalleryItem, PageInfo } from '~/types'
import { CACHE, cacheHeaders } from '~/utils/cache'
import { responsiveImage } from '~/utils/images'
import { buildSeoMeta } from '~/utils/seo.server'
import type { Route } from './+types/gallery'

// Cards are half of a phone's width and a quarter of the desktop page
const CARD_WIDTHS = [240, 360, 480, 640]
const CARD_SIZES = '(min-width: 64rem) 300px, (min-width: 48rem) 33vw, 50vw'
// The first row of cards is on screen when the page opens
const EAGER_CARDS = 4

type GalleriesData = {
  myGalleries: {
    nodes: GalleryItem[]
    pageInfo: PageInfo
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
        hasPreviousPage
        endCursor
        startCursor
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

export async function loader({ request }: Route.LoaderArgs) {
  const after = new URL(request.url).searchParams.get('after') ?? undefined
  const data = await fetchFromGraphQL<GalleriesData>(GET_GALLERIES, {
    first: PER_PAGE,
    after,
  })
  return {
    galleries: data.myGalleries.nodes,
    pageInfo: data.myGalleries.pageInfo,
    basePath: new URL(request.url).pathname,
    seo: buildSeoMeta(
      request,
      null,
      'Galériák - Színház.online',
      'Színházi fotógalériák: előadások, próbák és események képei a Színház.online-on.',
    ),
  }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Galériák - Színház.online' }]

export const headers = cacheHeaders(CACHE.list)

export default function Gallery() {
  const { galleries, pageInfo, basePath } = useLoaderData<typeof loader>()

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
      <Pagination pageInfo={pageInfo} basePath={basePath} />
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
