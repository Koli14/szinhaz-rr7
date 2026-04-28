export type TaxonomyColor = { taxColor: string | null }

export type Tag = {
  name: string
  slug: string
  taxonomyColor: TaxonomyColor | null
}

export type FeaturedImageSize = { name: string; sourceUrl: string }

export type FeaturedImage = {
  node: {
    title: string
    altText: string
    sourceUrl: string
    mediaDetails: { sizes: FeaturedImageSize[] }
  }
}

export type PostPreview = {
  title: string
  slug: string
  excerpt: string
  kiemeltCimke: { featuredTag: Tag | null }
  tags: { nodes: Tag[] }
  featuredImage: FeaturedImage
}

export type Post = {
  title: string
  content: string
  date: string
  kiemeltCimke: { featuredTag: Tag | null }
  tags: { nodes: Tag[] }
}

export type FlatMenuItem = {
  key: string
  parentId: string | null
  title: string
  uri: string
}

export type HierarchicalMenuItem = FlatMenuItem & {
  children?: HierarchicalMenuItem[]
}

export type GateBannerData = {
  gatebanner: {
    kep: { sourceUrl: string } | null
    link: { url: string } | null
  }
  gatebannermobile: {
    kep: { sourceUrl: string } | null
  }
}

export type RootData = {
  tagCloud: { tagCloud: { tagCloud: Tag[] } }
  menuItems: { nodes: FlatMenuItem[] }
  bannerek: { bannerek: GateBannerData }
}
