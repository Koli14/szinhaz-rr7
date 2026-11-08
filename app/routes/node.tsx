import { Box, Heading } from '@chakra-ui/react'
import {
  isRouteErrorResponse,
  redirect,
  useLoaderData,
  useRouteLoaderData,
} from 'react-router'
import { PostHeader } from '~/components/post/Header'
import { Banner } from '~/components/Banner'
import { AdSense, AD_SLOTS } from '~/components/AdSense'
import { CACHE, cacheHeaders } from '~/utils/cache'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import { buildSeoMeta, SEO_FIELDS } from '~/utils/seo.server'
import { relativizeContentLinks } from '~/utils/wp.server'
import type { Post } from '~/types'
import type { Route } from './+types/node'
import '~/styles/post.css'

type NodeData = {
  nodeByUri:
    | (Post & { __typename: 'Post'; seo: { fullHead: string | null } })
    | {
        __typename: 'Page' | 'Quote'
        title: string
        content: string | null
        isFrontPage?: boolean
        seo: { fullHead: string | null }
      }
    | { __typename: string }
    | null
}

const GET_NODE = gql`
  query getNode($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on Post {
        title
        content
        date
        uri
        ${SEO_FIELDS}
        kiemeltCimke {
          featuredTag {
            nodes {
              name
              slug
              ... on Tag {
                taxonomyColor {
                  taxColor
                }
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
      ... on Page {
        title
        content
        isFrontPage
        ${SEO_FIELDS}
      }
      ... on Quote {
        title
        content
        ${SEO_FIELDS}
      }
    }
  }
`

// The Frontity theme put an in-article ad after the 5th block of longer
// posts, unless the post starts with a "noAds" marker.
function splitForMiddleAd(html: string): [string, string] | null {
  if (html.trimStart().startsWith('noAds')) return null
  const closings = [...html.matchAll(/<\/(p|h[1-6]|ul|ol|figure|blockquote)>/g)]
  if (closings.length <= 6) return null
  const cut = closings[4].index! + closings[4][0].length
  return [html.slice(0, cut), html.slice(cut)]
}

export async function loader({ request }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (!pathname.endsWith('/')) throw redirect(`${pathname}/${search}`, 301)

  const data = await fetchFromGraphQL<NodeData>(GET_NODE, { uri: pathname })
  const node = data.nodeByUri
  if (!node || !('title' in node)) {
    throw new Response('Not Found', { status: 404 })
  }
  if ('isFrontPage' in node && node.isFrontPage) throw redirect('/', 301)

  const content = relativizeContentLinks(node.content ?? '')
  const seo = buildSeoMeta(request, node.seo, node.title)

  if (node.__typename === 'Post') {
    const post = node as Post
    return { kind: 'post' as const, post: { ...post, content }, seo }
  }
  return { kind: 'page' as const, title: node.title, content, seo }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: 'Az oldal nem található | Színház.online' }]

export const headers = cacheHeaders(CACHE.post)

function PostContent({ post }: { post: Post }) {
  const root = useRouteLoaderData<typeof import('../root').loader>('root')
  const banners = root?.banners
  const adsense = banners?.adsense
  const parts = adsense?.postbigadsense2 ? splitForMiddleAd(post.content) : null
  const contentProps = {
    className: 'postContainer',
    fontSize: { base: '0.9375rem', md: 'lg' },
    lineHeight: 'tall',
    color: 'rgba(12, 17, 43, 0.8)',
  }

  return (
    <Box maxWidth='800px' marginX='auto' px={{ base: '28px', md: '0' }}>
      <Box pt={{ base: '10px', lg: '2rem' }}>
        <Banner banner={banners?.bigbanner3} aspectRatio={100 / 30} />
        <Banner banner={banners?.bigbanner4} aspectRatio={100 / 30} />
        <Banner banner={banners?.whateversizebanner} />
        {adsense?.postbigadsense1 && <AdSense slot={AD_SLOTS.postTop1} />}
        {adsense?.postbigadsense1_2 && <AdSense slot={AD_SLOTS.postTop2} />}
        {adsense?.postbigadsense1_3 && <AdSense slot={AD_SLOTS.postTop3} />}
      </Box>

      <PostHeader post={post} />

      {parts ? (
        <Box {...contentProps} mt='10px'>
          <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
          <Box my='16px'>
            <AdSense slot={AD_SLOTS.postMiddle} inArticle />
          </Box>
          <div dangerouslySetInnerHTML={{ __html: parts[1] }} />
        </Box>
      ) : (
        <Box
          {...contentProps}
          mt='10px'
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}

      <Banner banner={banners?.bigbanner1} aspectRatio={100 / 30} />
      <Banner banner={banners?.bigbanner2} aspectRatio={100 / 30} />
      {adsense?.postlittleadsense1 && <AdSense slot={AD_SLOTS.postEnd1} />}
      {adsense?.postlittleadsense1_2 && <AdSense slot={AD_SLOTS.postEnd2} />}
      {adsense?.postlittleadsense1_3 && <AdSense slot={AD_SLOTS.postEnd3} />}

      <Banner
        banner={banners?.littlebanner1}
        aspectRatio={100 / 48}
        maxWidth='390px'
      />
      <Banner
        banner={banners?.littlebanner2}
        aspectRatio={100 / 48}
        maxWidth='390px'
      />
    </Box>
  )
}

export default function Node() {
  const data = useLoaderData<typeof loader>()

  if (data.kind === 'post') return <PostContent post={data.post} />

  return (
    <Box maxWidth='800px' marginX='auto' px={{ base: '28px', md: '0' }} py='6'>
      <Heading
        as='h1'
        fontFamily='heading'
        fontSize={{ base: 'xl', md: '2xl' }}
        mb='6'
        textTransform='uppercase'
        dangerouslySetInnerHTML={{ __html: data.title }}
      />
      <Box
        className='postContainer'
        fontSize={{ base: '0.9375rem', md: 'lg' }}
        lineHeight='tall'
        color='rgba(12, 17, 43, 0.8)'
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </Box>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message =
    isRouteErrorResponse(error) && error.status === 404
      ? 'Az oldal nem található.'
      : 'Nem sikerült betölteni az oldalt.'

  return (
    <Box maxWidth='800px' marginX='auto' px={{ base: '28px', md: '0' }} py='8'>
      <p>{message}</p>
    </Box>
  )
}
