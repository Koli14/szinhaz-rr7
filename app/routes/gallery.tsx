import { Box, Grid, Heading } from "@chakra-ui/react"
import { Link, useLoaderData } from "react-router"
import { Pagination } from "~/components/archive/Pagination"
import { fetchFromGraphQL, gql } from "~/utils/graphql.server"
import { POSTS_PER_PAGE as PER_PAGE } from "~/types"
import type { GalleryItem, PageInfo } from "~/types"
import type { Route } from "./+types/gallery"

type GalleriesData = {
  myGalleries: {
    nodes: GalleryItem[]
    pageInfo: PageInfo
  }
}

const GET_GALLERIES = gql`
  query getGalleries($first: Int!, $after: String) {
    myGalleries(first: $first, after: $after) {
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
  const after = new URL(request.url).searchParams.get("after") ?? undefined
  const data = await fetchFromGraphQL<GalleriesData>(GET_GALLERIES, {
    first: PER_PAGE,
    after,
  })
  return {
    galleries: data.myGalleries.nodes,
    pageInfo: data.myGalleries.pageInfo,
    basePath: new URL(request.url).pathname,
  }
}

export function meta() {
  return [{ title: "Galéria | Színház Online" }]
}

export default function Gallery() {
  const { galleries, pageInfo, basePath } = useLoaderData<typeof loader>()

  return (
    <Box px={{ base: "1rem", lg: "0" }} py="4">
      <Heading as="h1" size="lg" mb="6" textTransform="uppercase" fontFamily="heading">
        Galéria
      </Heading>
      {galleries.length === 0 ? (
        <Box color="gray.500" py="8">Nincs galéria.</Box>
      ) : (
        <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap="4">
          {galleries.map((gallery) => (
            <GalleryCard key={gallery.slug} gallery={gallery} />
          ))}
        </Grid>
      )}
      <Pagination pageInfo={pageInfo} basePath={basePath} />
    </Box>
  )
}

function GalleryCard({ gallery }: { gallery: GalleryItem }) {
  const img = gallery.featuredImage?.node

  return (
    <Box
      asChild
      display="block"
      borderRadius="md"
      overflow="hidden"
      position="relative"
      _hover={{ opacity: 0.85 }}
      transition="opacity 0.2s"
    >
      <Link to={`/galeria/${gallery.slug}`}>
        {img ? (
          <Box aspectRatio={4 / 3} overflow="hidden" bg="gray.100">
            <img
              src={img.sourceUrl}
              alt={img.altText || gallery.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        ) : (
          <Box aspectRatio={4 / 3} bg="gray.200" />
        )}
        <Box
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          bg="blackAlpha.700"
          color="white"
          px="3"
          py="2"
          fontSize="sm"
          fontFamily="heading"
          lineHeight="tight"
        >
          {gallery.title}
        </Box>
      </Link>
    </Box>
  )
}
