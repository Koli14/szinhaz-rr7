import { buildSeoMeta, SEO_FIELDS } from './seo.server'
import { fetchFromGraphQL, gql, POST_PREVIEW_FIELDS } from './graphql.server'
import { POSTS_PER_PAGE } from '~/types'
import type { PageInfo, PostPreview } from '~/types'

// Deeper pages need a cursor lookup first; keep crawlers from walking
// thousands of pages of the same listing.
const MAX_PAGE = 50

type PostConnection = { nodes: PostPreview[]; pageInfo: PageInfo }
type CursorConnection = { pageInfo: { endCursor: string | null } }

type SeoField = { fullHead: string | null } | undefined

type ArchiveNode<P> =
  | {
      __typename: 'Category' | 'Tag' | 'Folder'
      name: string
      seo?: SeoField
      posts: P
    }
  | { __typename: 'ContentType'; isPostsPage: boolean }
  | { __typename: string }

type PostsPage = { title: string; isPostsPage: boolean; seo?: SeoField }

type ArchiveResponse<P> = {
  nodeByUri: ArchiveNode<P> | null
  posts?: P
  postsPage?: { nodes: PostsPage[] } | null
}

const termFields = (posts: string) => gql`
  ... on Category { name ${SEO_FIELDS} ${posts} }
  ... on Tag { name ${SEO_FIELDS} ${posts} }
  ... on Folder { name ${SEO_FIELDS} ${posts} }
  ... on ContentType { isPostsPage }
`

// The posts page resolves to the `post` ContentType, which has no SEO data,
// and `page(idType: URI)` returns null for it: look the page up by slug.
const POSTS_PAGE = gql`
  postsPage: pages(first: 1, where: { name: $pageSlug }) @include(if: $root) {
    nodes {
      title
      isPostsPage
      ${SEO_FIELDS}
    }
  }
`

// Lists are in menu order (Simple Custom Post Order), as on Frontity.
// `$root` adds the unfiltered post list, used by the posts page (/hirek/)
const ARCHIVE_CURSOR = gql`
  query archiveCursor(
    $uri: String!
    $pageSlug: String!
    $skip: Int!
    $root: Boolean!
  ) {
    nodeByUri(uri: $uri) {
      __typename
      ${termFields('posts(first: $skip, where: { orderby: { field: MENU_ORDER, order: ASC } }) { pageInfo { endCursor } }')}
    }
    posts(first: $skip, where: { orderby: { field: MENU_ORDER, order: ASC } }) @include(if: $root) { pageInfo { endCursor } }
    ${POSTS_PAGE}
  }
`

const ARCHIVE_PAGE = gql`
  query archivePage(
    $uri: String!
    $pageSlug: String!
    $first: Int!
    $after: String
    $root: Boolean!
  ) {
    nodeByUri(uri: $uri) {
      __typename
      ${termFields(`posts(first: $first, after: $after, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
        pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
        nodes { ${POST_PREVIEW_FIELDS} }
      }`)}
    }
    posts(first: $first, after: $after, where: { orderby: { field: MENU_ORDER, order: ASC } }) @include(if: $root) {
      pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
      nodes { ${POST_PREVIEW_FIELDS} }
    }
    ${POSTS_PAGE}
  }
`

const isTermUri = (uri: string) => /^\/(category|tag|folder)\//.test(uri)

export type ArchiveData = {
  name: string
  posts: PostPreview[]
  page: number
  hasNextPage: boolean
  basePath: string
  seo: ReturnType<typeof buildSeoMeta>
}

function pickPosts<P>({
  nodeByUri: node,
  posts,
  postsPage,
}: ArchiveResponse<P>) {
  if (!node) return null
  if ('posts' in node) {
    return { name: node.name, seo: node.seo, posts: node.posts }
  }
  const page = postsPage?.nodes[0]
  if ('isPostsPage' in node && node.isPostsPage && posts && page?.isPostsPage) {
    return { name: page.title, seo: page.seo, posts }
  }
  return null
}

// Loads a paginated post list for a WordPress archive URI such as
// `/category/szinhaz/hirek/`, `/tag/szfe/`, `/folder/cimlap/` or the posts
// page (`/hirek/`). `page` follows WordPress' `/page/N/` URLs.
export async function loadArchive(
  request: Request,
  uri: string,
  page: number,
): Promise<ArchiveData> {
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new Response('Not Found', { status: 404 })
  }

  const root = !isTermUri(uri)
  let after: string | null = null
  if (page > 1) {
    const cursor = await fetchFromGraphQL<ArchiveResponse<CursorConnection>>(
      ARCHIVE_CURSOR,
      {
        uri,
        pageSlug: uri.split('/').filter(Boolean).pop() ?? '',
        skip: (page - 1) * POSTS_PER_PAGE,
        root,
      },
    )
    after = pickPosts(cursor)?.posts.pageInfo.endCursor ?? null
    if (!after) throw new Response('Not Found', { status: 404 })
  }

  const data = await fetchFromGraphQL<ArchiveResponse<PostConnection>>(
    ARCHIVE_PAGE,
    {
      uri,
      pageSlug: uri.split('/').filter(Boolean).pop() ?? '',
      first: POSTS_PER_PAGE,
      after,
      root,
    },
  )

  const picked = pickPosts(data)
  if (!picked || !picked.posts.nodes.length) {
    throw new Response('Not Found', { status: 404 })
  }

  return {
    name: picked.name,
    posts: picked.posts.nodes,
    page,
    hasNextPage: picked.posts.pageInfo.hasNextPage,
    basePath: uri,
    seo: buildSeoMeta(request, picked.seo, picked.name),
  }
}

// Splits `/category/a/b/page/3/` into `/category/a/b/` and 3
export function splitPagedPath(pathname: string) {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`
  const m = path.match(/^(.*\/)page\/(\d+)\/$/)
  return m ? { uri: m[1], page: Number(m[2]) } : { uri: path, page: 1 }
}
