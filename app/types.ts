export type TaxonomyColor = { taxColor: string | null }

export type Tag = {
  name: string
  slug: string
  taxonomyColor: TaxonomyColor | null
}

export type FeaturedImageSize = { name: string; sourceUrl: string }

export type FeaturedImage = {
  node: {
    title?: string
    altText: string
    sourceUrl: string
    mediaDetails: { sizes: FeaturedImageSize[] }
  }
}

export type PostPreview = {
  title: string
  slug: string
  excerpt: string
  kiemeltCimke: { featuredTag: { nodes: Tag[] } | null }
  tags: { nodes: Tag[] }
  featuredImage: FeaturedImage
}

export type Post = {
  title: string
  content: string
  date: string
  kiemeltCimke: { featuredTag: { nodes: Tag[] } | null }
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

export type BannerSlot = {
  kep: { sourceUrl: string } | null
  link: { url: string } | null
}

export type BannersData = {
  gatebanner: BannerSlot | null
  gatebannermobile: { kep: { sourceUrl: string } | null }
  bigbanner1: BannerSlot | null
  bigbanner2: BannerSlot | null
  bigbanner3: BannerSlot | null
  bigbanner4: BannerSlot | null
  littlebanner1: BannerSlot | null
  littlebanner2: BannerSlot | null
  adsense: {
    postbigadsense1: boolean | null
    postbigadsense1_2: boolean | null
    postbigadsense1_3: boolean | null
    postbigadsense2: boolean | null
    postlittleadsense1: boolean | null
    postlittleadsense1_2: boolean | null
    postlittleadsense1_3: boolean | null
    homebigadsense1: boolean | null
    homebigadsense2: boolean | null
    homelittleadsense1: boolean | null
    homelittleadsense2: boolean | null
  } | null
}

export type GateBannerData = BannersData

export type RootLoaderData = {
  tagClouds: Tag[]
  menuItems: FlatMenuItem[]
  banners: BannersData | null
}

export type PageInfo = {
  hasNextPage: boolean
  hasPreviousPage: boolean
  endCursor: string | null
  startCursor: string | null
}

export const POSTS_PER_PAGE = 10

export type GalleryItem = {
  title: string
  slug: string
  featuredImage: { node: { sourceUrl: string; altText: string } } | null
}
