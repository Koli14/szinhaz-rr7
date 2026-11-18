import { gql } from './graphql.server'
import type { HomeQuote } from '~/components/home/Quotes'

// The quote carousel ("Idézetek") of the home page and of posts on phones
export const QUOTES_QUERY = gql`
  quotes(first: 10, where: { orderby: { field: MENU_ORDER, order: ASC } }) {
    nodes {
      id
      content
      quoteFields {
        nev
        postLink { node { uri } }
      }
    }
  }
`

export type GqlQuotes = {
  nodes: {
    id: string
    content: string
    quoteFields: {
      nev: string | null
      postLink: { node: { uri: string } | null } | null
    } | null
  }[]
}

export const toQuotes = (quotes: GqlQuotes | null | undefined): HomeQuote[] =>
  (quotes?.nodes ?? []).map((q) => ({
    content: q.content,
    name: q.quoteFields?.nev ?? null,
    link: q.quoteFields?.postLink?.node?.uri ?? '/',
  }))
