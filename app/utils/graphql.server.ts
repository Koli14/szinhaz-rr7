export async function fetchFromGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const endpoint = process.env.GRAPHQL_API
  if (!endpoint) throw new Error("GRAPHQL_API env var is required")

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }

  return json.data as T
}

export const gql = String.raw
