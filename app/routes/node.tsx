import { Box, Flex } from '@chakra-ui/react'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import { PostHeader } from '~/components/post/Header'
import { PostContent } from '~/components/post/PostContent'
import { RelatedPosts } from '~/components/post/RelatedPosts'
import { Quotes } from '~/components/home/Quotes'
import { ShareButtons } from '~/components/post/ShareButtons'
import { Banner } from '~/components/Banner'
import { AdSense, AD_SLOTS } from '~/components/AdSense'
import { Tag } from '~/components/Tags'
import { NOT_FOUND_TITLE, PageError } from '~/components/NotFound'
import { CACHE, cacheHeaders, permanentRedirect } from '~/utils/cache'
import { untrackGraphqlKeys } from '~/utils/cacheTags.server'
import { fetchFromGraphQL, gql } from '~/utils/graphql.server'
import { FOLDER_POST_FIELDS, toFolderPost } from '~/utils/folderPost.server'
import type { GqlFolderPost } from '~/utils/folderPost.server'
import { buildSeoMeta, SEO_FIELDS } from '~/utils/seo.server'
import { QUOTES_QUERY, toQuotes } from '~/utils/quotes.server'
import type { GqlQuotes } from '~/utils/quotes.server'
import { relativizeContentLinks } from '~/utils/wp.server'
import type { Post, Tag as TagType } from '~/types'
import type { Route } from './+types/node'
import '~/styles/post.css'

type NodeData = {
  nodeByUri:
    | (Post & {
        __typename: 'Post'
        id: string
        seo: { fullHead: string | null }
      })
    | {
        __typename: 'Page' | 'Quote'
        title: string
        content: string | null
        isFrontPage?: boolean
        seo: { fullHead: string | null }
      }
    | { __typename: string }
    | null
  quotes: GqlQuotes
  relatedPosts: {
    relatedPostsFields: {
      relatedPosts: { nodes: (GqlFolderPost | Record<string, never>)[] } | null
    } | null
  } | null
}

const GET_NODE = gql`
  query getNode($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on Post {
        id
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
    ${QUOTES_QUERY}
    relatedPosts {
      relatedPostsFields {
        relatedPosts(first: 50) {
          nodes {
            ... on Post { ${FOLDER_POST_FIELDS} }
          }
        }
      }
    }
  }
`

// The Frontity theme put an in-article ad after the 5th block of longer
// posts, unless the post starts with a "noAds" marker. Only top-level blocks
// count: cutting inside a <blockquote> or list left it open, the browser then
// moved the ad into it and React's hydration failed.
const BLOCK_TAG =
  /<(\/?)(p|h[1-6]|ul|ol|figure|blockquote|div|table|pre)\b[^>]*>/gi

function splitForMiddleAd(html: string): [string, string] | null {
  if (html.trimStart().startsWith('noAds')) return null
  let depth = 0
  let blocks = 0
  let cut = -1
  for (const m of html.matchAll(BLOCK_TAG)) {
    if (!m[1]) {
      depth++
      continue
    }
    depth = Math.max(0, depth - 1)
    if (depth > 0) continue
    blocks++
    if (blocks === 5) cut = m.index + m[0].length
  }
  if (blocks <= 6 || cut < 0) return null
  return [html.slice(0, cut), html.slice(cut)]
}

// The featured tag first, then the rest of the post's tags
function postTags(post: Post): TagType[] {
  const featured = post.kiemeltCimke.featuredTag?.nodes ?? []
  const seen = new Set<string>()
  return [...featured, ...post.tags.nodes].filter(
    (tag) => !seen.has(tag.slug) && !!seen.add(tag.slug),
  )
}

export async function loader({ request }: Route.LoaderArgs) {
  const { pathname, search } = new URL(request.url)
  if (!pathname.endsWith('/')) throw permanentRedirect(`${pathname}/${search}`)

  const data = await fetchFromGraphQL<NodeData>(GET_NODE, { uri: pathname })
  const node = data.nodeByUri
  if (!node || !('title' in node)) {
    throw new Response('Not Found', { status: 404 })
  }
  if ('isFrontPage' in node && node.isFrontPage) throw permanentRedirect('/')

  const content = relativizeContentLinks(node.content ?? '')
  const seo = buildSeoMeta(request, node.seo, node.title)

  const related = (
    data.relatedPosts?.relatedPostsFields?.relatedPosts?.nodes ?? []
  ).filter((p): p is GqlFolderPost => 'uri' in p)
  // The related list and the quotes are the same on every post and page:
  // editing one of their posts should not invalidate all of them. They
  // refresh when the list itself is saved (its options page key stays), a
  // quote is added (list:quote) or when their TTL ends.
  const ownId = 'id' in node ? node.id : null
  untrackGraphqlKeys(related.map((p) => p.id).filter((id) => id !== ownId))
  untrackGraphqlKeys(data.quotes.nodes.map((q) => q.id))
  const shared = {
    uri: pathname,
    content,
    relatedPosts: related.filter((p) => p.uri !== pathname).map(toFolderPost),
    quotes: toQuotes(data.quotes),
    seo,
  }

  if (node.__typename === 'Post') {
    const post = node as Post
    return {
      ...shared,
      title: post.title,
      date: post.date,
      tags: postTags(post),
    }
  }
  return { ...shared, title: node.title, date: null, tags: [] }
}

export const meta: Route.MetaFunction = ({ data }) =>
  data?.seo ?? [{ title: NOT_FOUND_TITLE }]

export const headers = cacheHeaders(CACHE.post)

// Posts and pages share the Frontity post layout: banners, title, content
// with an ad in the middle, tags, share buttons, end banners and (on mobile)
// the related posts and the quotes.
export default function Node() {
  const { title, uri, date, tags, content, relatedPosts, quotes } =
    useLoaderData<typeof loader>()
  const root = useRouteLoaderData<typeof import('../root').loader>('root')
  const banners = root?.banners
  const adsense = banners?.adsense
  const parts = adsense?.postbigadsense2 ? splitForMiddleAd(content) : null
  // Text size and line height are set on the paragraphs in post.css
  const contentProps = {
    className: 'postContainer',
    color: 'rgba(12, 17, 43, 0.8)',
    pt: { base: '1', md: '5' },
    mb: '40px',
  }

  return (
    // Extra room on desktop between the share buttons (or end banners) and
    // the footer's line
    <Box
      maxWidth='800px'
      marginX='auto'
      px={{ base: '28px', md: '0' }}
      pb={{ base: '0', md: '40px' }}
    >
      <Box pt={{ base: '10px', lg: '2rem' }}>
        <Banner
          banner={banners?.bigbanner3}
          aspectRatio={100 / 30}
          loading='eager'
        />
        <Banner
          banner={banners?.bigbanner4}
          aspectRatio={100 / 30}
          loading='eager'
        />
        <Banner banner={banners?.whateversizebanner} loading='eager' />
        {adsense?.postbigadsense1 && (
          <AdSense slot={AD_SLOTS.postTop1} placeholder />
        )}
        {adsense?.postbigadsense1_2 && (
          <AdSense slot={AD_SLOTS.postTop2} placeholder />
        )}
        {adsense?.postbigadsense1_3 && (
          <AdSense slot={AD_SLOTS.postTop3} placeholder />
        )}
        <PostHeader
          mt={{ base: '10px', lg: '2rem' }}
          title={title}
          tag={tags[0]}
          date={date}
        />
      </Box>

      <Box {...contentProps}>
        {parts ? (
          <>
            <PostContent html={parts[0]} />
            <Box my='16px'>
              <AdSense slot={AD_SLOTS.postMiddle} inArticle />
            </Box>
            <PostContent html={parts[1]} />
          </>
        ) : (
          <PostContent html={content} />
        )}
      </Box>

      {tags.length > 0 && (
        <Flex flexWrap='wrap' gap='6px'>
          {tags.map((tag) => (
            <Tag key={tag.slug} tag={tag} />
          ))}
        </Flex>
      )}
      <ShareButtons uri={uri} title={title} />

      <Banner banner={banners?.bigbanner1} aspectRatio={100 / 30} />
      <Banner banner={banners?.bigbanner2} aspectRatio={100 / 30} mb='20px' />
      {adsense?.postlittleadsense1 && <AdSense slot={AD_SLOTS.postEnd1} />}
      {adsense?.postlittleadsense1_2 && <AdSense slot={AD_SLOTS.postEnd2} />}
      {adsense?.postlittleadsense1_3 && <AdSense slot={AD_SLOTS.postEnd3} />}

      <RelatedPosts
        posts={relatedPosts}
        display={{ base: 'block', lg: 'none' }}
        mx={{ base: '-28px', md: '0' }}
      />
      <Quotes
        quotes={quotes}
        display={{ base: 'block', md: 'none' }}
        my='0'
        mx='-28px'
      />

      <Banner
        banner={banners?.littlebanner1}
        aspectRatio={100 / 48}
        maxWidth='390px'
      />
      <Banner
        banner={banners?.littlebanner2}
        aspectRatio={100 / 48}
        maxWidth='390px'
        mb='20px'
      />
    </Box>
  )
}

export { PageError as ErrorBoundary }
