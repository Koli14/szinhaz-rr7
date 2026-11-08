import { Box } from "@chakra-ui/react"
import { useLoaderData, useParams, isRouteErrorResponse, useRouteLoaderData } from "react-router"
import { PostHeader } from "~/components/post/Header"
import { Banner } from "~/components/Banner"
import { AdSense } from "~/components/AdSense"
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
  const root = useRouteLoaderData<typeof import("../root").loader>("root")
  const banners = root?.banners
  const adsense = banners?.adsense

  return (
    <Box maxWidth="800px" marginX="auto" px={{ base: "28px", md: "0" }}>
      {/* Before post header: bigbanner3, bigbanner4, top adsense */}
      <Box pt={{ base: "10px", lg: "2rem" }}>
        <Banner banner={banners?.bigbanner3} />
        <Banner banner={banners?.bigbanner4} />
        {adsense?.postbigadsense1 && <AdSense slot="7282421936" />}
        {adsense?.postbigadsense1_2 && <AdSense slot="7282421936" />}
        {adsense?.postbigadsense1_3 && <AdSense slot="7282421936" />}
      </Box>

      <PostHeader post={post} />

      {/* Post content */}
      <Box
        className="postContainer"
        fontSize={{ base: "0.9375rem", md: "lg" }}
        lineHeight="tall"
        color="rgba(12, 17, 43, 0.8)"
        mt="10px"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* After content: bigbanner1, bigbanner2, bottom adsense */}
      <Banner banner={banners?.bigbanner1} mt="20px" />
      <Banner banner={banners?.bigbanner2} mt="20px" />
      {adsense?.postbigadsense2 && <AdSense slot="5445334265" />}

      {/* Little banners at the end */}
      <Banner banner={banners?.littlebanner1} mt="20px" />
      <Banner banner={banners?.littlebanner2} mt="20px" />
      {adsense?.postlittleadsense1 && <AdSense slot="9828694222" />}
      {adsense?.postlittleadsense1_2 && <AdSense slot="9828694222" />}
      {adsense?.postlittleadsense1_3 && <AdSense slot="9828694222" />}
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
