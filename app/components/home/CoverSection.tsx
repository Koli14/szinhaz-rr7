import { Box } from '@chakra-ui/react'
import { CoverItem } from './CoverItem'
import { FeaturedItem } from './FeaturedItem'
import type { PostPreview } from '~/types'

export const LeftCoverItems = ({
  featuredItems,
  items,
}: {
  featuredItems: PostPreview[]
  items: PostPreview[]
}) => (
  <Box flex={2} mr={{ base: 0, lg: 3 }}>
    <FeaturedItem item={featuredItems[0]} />
    <FeaturedItem item={featuredItems[1]} mobileOnly />
    {items.map((item) => (
      <CoverItem key={item.slug} item={item} />
    ))}
  </Box>
)

export const RightCoverItems = ({
  featuredItem,
  items,
}: {
  featuredItem: PostPreview
  items: PostPreview[]
}) => (
  <Box flex={1} ml={{ base: 0, lg: 3 }}>
    <FeaturedItem item={featuredItem} desktopOnly />
    {items.map((item) => (
      <CoverItem key={item.slug} item={item} />
    ))}
  </Box>
)
