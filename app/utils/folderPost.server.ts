import type { FolderPost } from '~/components/home/Folders'

// Small post teasers (thumbnail, title, short excerpt) as used by the home
// page folders and the related posts list.

export type GqlImage = {
  node: { altText: string; sourceUrl: string; sized: string | null }
} | null

export type GqlFolderPost = {
  id: string
  title: string
  uri: string
  excerpt: string | null
  featuredImage: GqlImage
}

export const FOLDER_POST_FIELDS = `
  id
  title
  uri
  excerpt
  featuredImage {
    node { altText sourceUrl sized: sourceUrl(size: THUMBNAIL) }
  }
`

export const toImage = (img: GqlImage) =>
  img?.node
    ? { src: img.node.sized ?? img.node.sourceUrl, alt: img.node.altText }
    : null

// Plain text, cut at a word boundary like the Frontity theme did
export function shortExcerpt(html: string, max = 100) {
  const text = html
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  return `${cut.slice(0, cut.lastIndexOf(' '))}...`
}

export const toFolderPost = (p: GqlFolderPost): FolderPost => ({
  title: p.title,
  uri: p.uri,
  excerpt: shortExcerpt(p.excerpt ?? ''),
  image: toImage(p.featuredImage),
})
