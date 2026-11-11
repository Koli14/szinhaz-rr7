import { recordGraphqlKeys } from './cacheTags.server'
import { getGraphqlEndpoint } from './wp.server'

// The shared hosting answers 429/502/503 for a moment when it is busy or
// restarts PHP: one retry after a short pause usually gets through
const RETRY_STATUSES = new Set([429, 502, 503])
const RETRY_DELAY_MS = 700

export async function fetchFromGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const request = () =>
    fetch(getGraphqlEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    })
  let response = await request()
  if (RETRY_STATUSES.has(response.status)) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    response = await request()
  }

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed: ${response.status} ${response.statusText}`,
    )
  }

  // Content keys of WPGraphQL Smart Cache, used as CDN cache tags
  recordGraphqlKeys(response.headers.get('x-graphql-keys'))

  const json = await response.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }

  return json.data as T
}

export const gql = String.raw

// Fields needed to render a post in lists (home, archives, search)
export const POST_PREVIEW_FIELDS = gql`
  title
  slug
  uri
  excerpt
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
`
