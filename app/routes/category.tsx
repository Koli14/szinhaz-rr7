import { Box, Heading } from "@chakra-ui/react"
import { useLoaderData } from "react-router"
import { ArchiveItem } from "~/components/archive/ArchiveItem"
import { Pagination } from "~/components/archive/Pagination"
import { fetchFromGraphQL, gql } from "~/utils/graphql.server"
import { POSTS_PER_PAGE } from "~/types"
import type { PostPreview, PageInfo } from "~/types"
import type { Route } from "./+types/category"

type CategoryData = {
  category: {
    name: string
    posts: {
      nodes: PostPreview[]
      pageInfo: PageInfo
    }
  } | null
}

const GET_CATEGORY = gql`
  query getCategoryArchive($slug: ID!, $first: Int!, $after: String) {
    category(id: $slug, idType: SLUG) {
      name
      posts(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
        nodes {
          title
          slug
          excerpt
          kiemeltCimke {
            featuredTag {
              nodes {
                name
                slug
                ... on Tag {
                  taxonomyColor { taxColor }
                }
              }
            }
          }
          tags {
            nodes {
              name
              slug
              taxonomyColor { taxColor }
            }
          }
          featuredImage {
            node {
              altText
              sourceUrl
              mediaDetails {
                sizes { name sourceUrl }
              }
            }
          }
        }
      }
    }
  }
`

export async function loader({ params, request }: Route.LoaderArgs) {
  const after = new URL(request.url).searchParams.get("after") ?? undefined
  const data = await fetchFromGraphQL<CategoryData>(GET_CATEGORY, {
    slug: params.categorySlug,
    first: POSTS_PER_PAGE,
    after,
  })
  if (!data.category) throw new Response("Not Found", { status: 404 })
  return {
    name: data.category.name,
    posts: data.category.posts.nodes,
    pageInfo: data.category.posts.pageInfo,
    basePath: new URL(request.url).pathname,
  }
}

export function meta({ data }: Route.MetaArgs) {
  const title = data?.name ? `${data.name} | Színház Online` : "Színház Online"
  return [{ title }]
}

export default function CategoryArchive() {
  const { name, posts, pageInfo, basePath } = useLoaderData<typeof loader>()
  return (
    <Box px={{ base: "1rem", lg: "0" }} py="4">
      <Heading as="h1" size="lg" mb="6" textTransform="uppercase" fontFamily="heading">
        {name}
      </Heading>
      <Box>
        {posts.map((post, i) => (
          <ArchiveItem key={post.slug} item={post} featured={i === 0} />
        ))}
      </Box>
      <Pagination pageInfo={pageInfo} basePath={basePath} />
    </Box>
  )
}
