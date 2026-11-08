import { Box, Flex, Heading, Text } from '@chakra-ui/react'
import { useRef } from 'react'
import { useLoaderData } from 'react-router'
import { Carousel } from '~/components/Carousel'
import type { CarouselApi } from '~/components/Carousel'
import { Tag } from '~/components/Tags'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import { CACHE, cacheHeaders } from '~/utils/cache'
import { formatDate } from '~/utils/helpers'
import { buildSeoMeta, SEO_FIELDS } from '~/utils/seo.server'
import type { Tag as TagType } from '~/types'
import type { Route } from './+types/gallery-single'
import '~/styles/post.css'

type GalleryImage = {
  databaseId: number
  title: string | null
  altText: string | null
  large: string | null
  thumb: string | null
  sourceUrl: string
}

type GalleryPost = {
  title: string
  date: string
  tags: { nodes: TagType[] }
  galleryFields: { galeria: { nodes: GalleryImage[] } | null } | null
  seo: { fullHead: string | null } | null
}

type GalleryData = {
  myGallery: GalleryPost | null
}

const GET_GALLERY = gql`
  query getGallery($slug: ID!) {
    myGallery(id: $slug, idType: SLUG) {
      title
      date
      ${SEO_FIELDS}
      tags {
        nodes {
          name
          slug
          taxonomyColor {
            taxColor
          }
        }
      }
      galleryFields {
        galeria(first: 200) {
          nodes {
            databaseId
            title
            altText
            sourceUrl
            large: sourceUrl(size: LARGE)
            thumb: sourceUrl(size: THUMBNAIL)
          }
        }
      }
    }
  }
`

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await fetchFromGraphQL<GalleryData>(GET_GALLERY, {
    slug: params.gallerySlug,
  })
  const gallery = data.myGallery
  if (!gallery) throw new Response('Not Found', { status: 404 })
  return {
    gallery: {
      title: gallery.title,
      date: gallery.date,
      tag: gallery.tags.nodes[0] ?? null,
      images: (gallery.galleryFields?.galeria?.nodes ?? []).map((img) => ({
        id: img.databaseId,
        title: img.title ?? '',
        alt: img.altText || img.title || gallery.title,
        src: img.large ?? img.sourceUrl,
        thumb: img.thumb ?? img.sourceUrl,
      })),
    },
    seo: buildSeoMeta(request, gallery.seo, gallery.title),
  }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Az oldal nem található | Színház.online' }]

export const headers = cacheHeaders(CACHE.post)

export default function GallerySingle() {
  const { gallery } = useLoaderData<typeof loader>()
  const carousel = useRef<CarouselApi>(null)
  const top = useRef<HTMLDivElement>(null)

  const show = (index: number) => {
    carousel.current?.goTo(index)
    top.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Box maxWidth='900px' marginX='auto' px={{ base: '32px', md: '0' }}>
      <Box pt={{ base: '20px', lg: '4rem' }} pb={{ base: '2rem', lg: '5' }}>
        {gallery.tag && <Tag tag={gallery.tag} />}
        <Heading
          as='h1'
          fontWeight='bold'
          lineHeight='1.25'
          fontSize={{ base: '1.0625rem', lg: '1.875rem' }}
          mt='5'
          mb='3'
          textTransform='uppercase'
          dangerouslySetInnerHTML={{ __html: gallery.title }}
        />
        <Text fontSize={{ base: '0.75rem', lg: '1rem' }} mt='12px'>
          {formatDate(gallery.date)}
        </Text>
      </Box>

      {gallery.images.length > 0 && (
        <Box ref={top} pt='5' pb='80px' textAlign='center'>
          <Carousel
            label='Galéria képei'
            apiRef={carousel}
            arrowColor='#9D9D9D'
          >
            {gallery.images.map((img, i) => (
              <Box key={img.id} w='100%'>
                <img
                  src={img.src}
                  alt={img.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  style={{
                    display: 'inline-block',
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    padding: 1,
                  }}
                />
                <Box mt='20px' mb='40px' opacity='0.8'>
                  {img.title}
                </Box>
              </Box>
            ))}
          </Carousel>

          <Flex justifyContent='center' flexWrap='wrap'>
            {gallery.images.map((img, i) => (
              <Box
                as='button'
                key={img.id}
                aria-label={`${i + 1}. kép`}
                onClick={() => show(i)}
                width='120px'
                p='1px'
                cursor='pointer'
              >
                <img
                  src={img.thumb}
                  alt={img.alt}
                  loading='lazy'
                  style={{ width: '100%', aspectRatio: 1, objectFit: 'cover' }}
                />
              </Box>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  )
}
