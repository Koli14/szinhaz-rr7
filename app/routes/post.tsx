import { Box } from "@chakra-ui/react"
import { useLoaderData, useParams, isRouteErrorResponse } from "react-router"
import { PostHeader } from "~/components/post/Header"
import { fetchFromGraphQL, gql } from "~/utils/graphql.server"
import type { Post } from "~/types"
import type { Route } from "./+types/post"
import "~/styles/post.css"

type PostData = {
  post: Post | null
}

const GET_POST = gql`
  query getPost($postSlug: ID!) {
    post(id: $postSlug, idType: SLUG) {
      title
      content
      date
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
    }
  }
`

export async function loader({ params }: Route.LoaderArgs) {
  const data = await fetchFromGraphQL<PostData>(GET_POST, {
    postSlug: params.postSlug,
  })

  if (!data.post) {
    throw new Response("Not Found", { status: 404 })
  }

  return { post: data.post }
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) return [{ title: "Nem található | Színház Online" }]
  return [{ title: `${data.post.title} | Színház Online` }]
}

export default function Post() {
  const { post } = useLoaderData<typeof loader>()

  return (
    <Box maxWidth="800px" marginX="auto" px={{ base: "28px", md: "0" }}>
      <PostHeader post={post} />
      <Box
        className="postContainer"
        fontSize={{ base: "0.9375rem", md: "lg" }}
        lineHeight="tall"
        color="rgba(12, 17, 43, 0.8)"
        mt="10px"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </Box>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { postSlug } = useParams()
  const message = isRouteErrorResponse(error) && error.status === 404
    ? `A(z) "${postSlug}" cikk nem található.`
    : "Nem sikerült betölteni a cikket."

  return (
    <Box maxWidth="800px" marginX="auto" px={{ base: "28px", md: "0" }} py="8">
      <p>{message}</p>
    </Box>
  )
}
