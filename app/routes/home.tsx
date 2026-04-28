import { Box, Flex } from "@chakra-ui/react"
import { useLoaderData } from "react-router"
import { LeftCoverItems, RightCoverItems } from "~/components/home/CoverSection"
import { fetchFromGraphQL, gql } from "~/utils/graphql.server"
import type { PostPreview } from "~/types"
import type { Route } from "./+types/home"

type HomeData = {
  folder: {
    posts: {
      nodes: PostPreview[]
    }
  }
}

const GET_HOME = gql`
  query getHome {
    folder(id: "cimlap", idType: SLUG) {
      posts(
        first: 100
        where: { orderby: { field: MENU_ORDER, order: ASC } }
      ) {
        nodes {
          excerpt
          title
          slug
          kiemeltCimke {
            featuredTag {
              name
              slug
              taxonomyColor {
                taxColor
              }
            }
          }
          tags {
            nodes {
              name
              slug
              taxonomyColor {
                taxColor
              }
            }
          }
          featuredImage {
            node {
              title
              altText
              sourceUrl
              mediaDetails {
                sizes {
                  name
                  sourceUrl
                }
              }
            }
          }
        }
      }
    }
  }
`

export async function loader(_: Route.LoaderArgs) {
  const data = await fetchFromGraphQL<HomeData>(GET_HOME)
  return { nodes: data.folder.posts.nodes }
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Színház Online" },
    { name: "description", content: "A színházi világ hírei" },
  ]
}

export default function Home() {
  const { nodes: items } = useLoaderData<typeof loader>()
  const featuredItems = [items[0], items[6]]
  const leftItems = items.slice(1, 6)
  const rightItems = items.slice(7)

  return (
    <Box>
      <Flex as="section" direction={{ base: "column", lg: "row" }}>
        <LeftCoverItems featuredItems={featuredItems} items={leftItems} />
        <RightCoverItems featuredItem={featuredItems[1]} items={rightItems} />
      </Flex>
    </Box>
  )
}
