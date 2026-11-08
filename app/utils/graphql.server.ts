import { getGraphqlEndpoint } from './wp.server'

export async function fetchFromGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(getGraphqlEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(
      `GraphQL request failed: ${response.status} ${response.statusText}`,
    )
  }

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
