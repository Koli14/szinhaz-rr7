import { Box, Flex } from '@chakra-ui/react'
import { redirect, useLoaderData } from 'react-router'
import { LeftCoverItems, RightCoverItems } from '~/components/home/CoverSection'
import { FolderRow } from '~/components/home/Folders'
import type { HomeFolder } from '~/components/home/Folders'
import { GallerySection } from '~/components/home/GallerySection'
import type { HomeGallery } from '~/components/home/GallerySection'
import { Quotes } from '~/components/home/Quotes'
import type { HomeQuote } from '~/components/home/Quotes'
import { Instagram } from '~/components/Instagram'
import type { InstaPost } from '~/components/Instagram'
import { CACHE, cacheHeaders } from '~/utils/cache'
import {
  fetchFromGraphQL,
  gql,
  POST_PREVIEW_FIELDS,
} from '~/utils/graphql.server'
import { buildSeoMeta, SEO_FIELDS } from '~/utils/seo.server'
import {
  FOLDER_POST_FIELDS,
  toFolderPost,
  toImage,
} from '~/utils/folderPost.server'
import type { GqlFolderPost, GqlImage } from '~/utils/folderPost.server'
import type { PostPreview } from '~/types'
import type { Route } from './+types/home'

type GqlFolder = {
  __typename: string
  name: string
  slug: string
  taxonomyColor: { taxColor: string | null } | null
  posts: { nodes: GqlFolderPost[] }
}

type FolderList = { nodes: GqlFolder[] } | null

type HomeData = {
  folder: { posts: { nodes: PostPreview[] } } | null
  frontPage: {
    seo: { fullHead: string | null }
    homepage: {
      folderek1Bal: FolderList
      folderek1Jobb: FolderList
      folderek2Bal: FolderList
      folderek2Jobb: FolderList
    } | null
  } | null
  quotes: {
    nodes: {
      content: string
      quoteFields: {
        nev: string | null
        postLink: { node: { uri: string } | null } | null
      } | null
    }[]
  }
  myGalleries: {
    nodes: { title: string; uri: string; featuredImage: GqlImage }[]
  }
}

// Frontity listed up to 99 posts per folder, in menu order
const FOLDER_FIELDS = gql`
  nodes {
    __typename
    ... on Folder {
      name
      slug
      taxonomyColor { taxColor }
      posts(first: 99, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
        nodes { ${FOLDER_POST_FIELDS} }
      }
    }
  }
`

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
        homepage {
          folderek1Bal { ${FOLDER_FIELDS} }
          folderek1Jobb { ${FOLDER_FIELDS} }
          folderek2Bal { ${FOLDER_FIELDS} }
          folderek2Jobb { ${FOLDER_FIELDS} }
        }
      }
    }
    quotes(first: 10, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
      nodes {
        content
        quoteFields {
          nev
          postLink { node { uri } }
        }
      }
    }
    myGalleries(first: 10, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
      nodes {
        title
        uri
        featuredImage {
          node { altText sourceUrl sized: sourceUrl(size: MEDIUM_LARGE) }
        }
      }
    }
  }
`

function toFolders(list: FolderList): HomeFolder[] {
  return (list?.nodes ?? [])
    .filter((f) => f.__typename === 'Folder')
    .map((f) => ({
      name: f.name,
      slug: f.slug,
      color: f.taxonomyColor?.taxColor ?? null,
      posts: f.posts.nodes.map(toFolderPost),
    }))
}

type InstaFeed = {
  data?: {
    id: string
    permalink: string
    media_url: string
    thumbnail_url?: string
    media_type?: string
  }[]
}

// The Instagram proxy only answers requests from the production origin.
// The section must never break or slow down the home page.
async function loadInstagram(): Promise<InstaPost[]> {
  try {
    const res = await fetch('https://insta.szinhaz.online', {
      headers: { Origin: 'https://szinhaz.online' },
      signal: AbortSignal.timeout(1500),
    })
    const text = res.ok ? await res.text() : ''
    if (!text) return []
    const feed = JSON.parse(text) as InstaFeed
    return (feed.data ?? []).slice(0, 8).map((item) => ({
      id: item.id,
      url: item.permalink,
      thumbnail:
        item.media_type === 'VIDEO' && item.thumbnail_url
          ? item.thumbnail_url
          : item.media_url,
    }))
  } catch {
    return []
  }
}

export async function loader({ request }: Route.LoaderArgs) {
  // WordPress search URLs (/?s=…), as used by Yoast's SearchAction schema
  const s = new URL(request.url).searchParams.get('s')
  if (s !== null) throw redirect(`/search?s=${encodeURIComponent(s)}`)

  const [data, instagram] = await Promise.all([
    fetchFromGraphQL<HomeData>(GET_HOME),
    loadInstagram(),
  ])
  const folders = data.frontPage?.homepage

  const quotes: HomeQuote[] = data.quotes.nodes.map((q) => ({
    content: q.content,
    name: q.quoteFields?.nev ?? null,
    link: q.quoteFields?.postLink?.node?.uri ?? '/',
  }))
  const galleries: HomeGallery[] = data.myGalleries.nodes.map((g) => ({
    title: g.title,
    uri: g.uri,
    image: toImage(g.featuredImage),
  }))

  return {
    nodes: data.folder?.posts.nodes ?? [],
    // The first column shows the "jobb" folders, as on the Frontity site
    folders1: {
      left: toFolders(folders?.folderek1Jobb ?? null),
      right: toFolders(folders?.folderek1Bal ?? null),
    },
    folders2: {
      left: toFolders(folders?.folderek2Jobb ?? null),
      right: toFolders(folders?.folderek2Bal ?? null),
    },
    quotes,
    galleries,
    instagram,
    seo: buildSeoMeta(request, data.frontPage?.seo, 'Színház.online'),
  }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Színház.online' }]

export const headers = cacheHeaders(CACHE.list)

export default function Home() {
  const {
    nodes: items,
    folders1,
    folders2,
    quotes,
    galleries,
    instagram,
  } = useLoaderData<typeof loader>()
  const featuredItems = [items[0], items[6]]
  const leftItems = items.slice(1, 6)
  const rightItems = items.slice(7)

  return (
    <Box>
      <Flex as='section' direction={{ base: 'column', lg: 'row' }}>
        <LeftCoverItems featuredItems={featuredItems} items={leftItems} />
        <RightCoverItems featuredItem={featuredItems[1]} items={rightItems} />
      </Flex>
      <GallerySection galleries={galleries} />
      <FolderRow {...folders1} />
      <Quotes quotes={quotes} />
      <FolderRow {...folders2} />
      <Instagram posts={instagram} />
    </Box>
  )
}
