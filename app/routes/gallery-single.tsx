import { Box, Heading } from '@chakra-ui/react'
import { useLoaderData } from 'react-router'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import { CACHE, cacheHeaders } from '~/utils/cache'
import { buildSeoMeta, SEO_FIELDS } from '~/utils/seo.server'
import type { Route } from './+types/gallery-single'
import '~/styles/post.css'

type GalleryPost = {
  title: string
  content: string
  featuredImage: { node: { sourceUrl: string; altText: string } } | null
  seo: { fullHead: string | null } | null
}

type GalleryData = {
  myGallery: GalleryPost | null
}

const GET_GALLERY = gql`
  query getGallery($slug: ID!) {
    myGallery(id: $slug, idType: SLUG) {
      title
      content
      ${SEO_FIELDS}
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
  }
`

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await fetchFromGraphQL<GalleryData>(GET_GALLERY, {
    slug: params.gallerySlug,
  })
  if (!data.myGallery) throw new Response('Not Found', { status: 404 })
  return {
    gallery: data.myGallery,
    seo: buildSeoMeta(request, data.myGallery.seo, data.myGallery.title),
  }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Az oldal nem található | Színház.online' }]

export const headers = cacheHeaders(CACHE.post)

export default function GallerySingle() {
  const { gallery } = useLoaderData<typeof loader>()
  const img = gallery.featuredImage?.node

  return (
    <Box maxWidth='900px' marginX='auto' px={{ base: '28px', md: '0' }} py='6'>
      <Heading
        as='h1'
        fontFamily='heading'
        fontSize={{ base: 'xl', md: '2xl' }}
        mb='6'
      >
        {gallery.title}
      </Heading>
      {img && (
        <Box mb='6'>
          <img
            src={img.sourceUrl}
            alt={img.altText || gallery.title}
            style={{ width: '100%' }}
          />
        </Box>
      )}
      {gallery.content && (
        <Box
          className='postContainer'
          fontSize={{ base: '0.9375rem', md: 'lg' }}
          lineHeight='tall'
          color='rgba(12, 17, 43, 0.8)'
          dangerouslySetInnerHTML={{ __html: gallery.content }}
        />
      )}
    </Box>
  )
}
