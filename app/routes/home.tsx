import { Box, Flex } from '@chakra-ui/react'
import { redirect, useLoaderData } from 'react-router'
import { LeftCoverItems, RightCoverItems } from '~/components/home/CoverSection'
import { CACHE, cacheHeaders } from '~/utils/cache'
import {
  fetchFromGraphQL,
  gql,
  POST_PREVIEW_FIELDS,
} from '~/utils/graphql.server'
import { buildSeoMeta, SEO_FIELDS } from '~/utils/seo.server'
import type { PostPreview } from '~/types'
import type { Route } from './+types/home'

type HomeData = {
  folder: { posts: { nodes: PostPreview[] } } | null
  frontPage: { seo: { fullHead: string | null } } | null
}

const GET_HOME = gql`
  query getHome {
    folder(id: "cimlap", idType: SLUG) {
      posts(
        first: 100
        where: { orderby: { field: MENU_ORDER, order: ASC } }
      ) {
        nodes {
          ${POST_PREVIEW_FIELDS}
        }
      }
    }
    frontPage: nodeByUri(uri: "/") {
      ... on Page {
        ${SEO_FIELDS}
      }
    }
  }
`

export async function loader({ request }: Route.LoaderArgs) {
  // WordPress search URLs (/?s=…), as used by Yoast's SearchAction schema
  const s = new URL(request.url).searchParams.get('s')
  if (s !== null) throw redirect(`/search?s=${encodeURIComponent(s)}`)

  const data = await fetchFromGraphQL<HomeData>(GET_HOME)
  return {
    nodes: data.folder?.posts.nodes ?? [],
    seo: buildSeoMeta(request, data.frontPage?.seo, 'Színház.online'),
  }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Színház.online' }]

export const headers = cacheHeaders(CACHE.list)

export default function Home() {
  const { nodes: items } = useLoaderData<typeof loader>()
  const featuredItems = [items[0], items[6]]
  const leftItems = items.slice(1, 6)
  const rightItems = items.slice(7)

  return (
    <Box>
      <Flex as='section' direction={{ base: 'column', lg: 'row' }}>
        <LeftCoverItems featuredItems={featuredItems} items={leftItems} />
        <RightCoverItems featuredItem={featuredItems[1]} items={rightItems} />
      </Flex>
    </Box>
  )
}
