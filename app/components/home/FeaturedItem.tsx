import { Box } from '@chakra-ui/react'
import { Link } from '~/components/Link'
import { CoverTag } from '~/components/Tags'
import { CoverExcerpt, CoverHeading } from './CoverItem'
import type { PostPreview } from '~/types'

export const FeaturedItem = ({
  item,
  mobileOnly,
  desktopOnly,
}: {
  item: PostPreview
  mobileOnly?: boolean
  desktopOnly?: boolean
}) => {
  const image = item.featuredImage.node
  const tag = item.kiemeltCimke.featuredTag?.nodes?.[0] ?? item.tags.nodes[0]
  const isBig = !mobileOnly && !desktopOnly
  const bgColor = tag?.taxonomyColor?.taxColor || '#F4A91C'

  return (
    <Box
      display={{
        base: desktopOnly ? 'none' : 'block',
        lg: mobileOnly ? 'none' : 'block',
      }}
    >
      <Box pos='relative' mb={{ lg: '22px' }}>
        <Link to={item.uri ?? `/${item.slug}/`}>
          <Box aspectRatio={16 / 9} overflow='hidden' width='100%'>
            <img
              src={image.sourceUrl}
              alt={image.altText}
              title={image.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        </Link>
        {tag && <CoverTag tag={tag} />}
      </Box>
      <Link to={item.uri ?? `/${item.slug}/`}>
        <CoverHeading
          title={item.title}
          bgColor={bgColor}
          fontSize={{ base: '1.25rem', md: isBig ? '1.67rem' : '1.375rem' }}
          color={{ base: bgColor ? 'white' : 'black', md: 'black' }}
          backgroundColor={{ base: bgColor, md: 'transparent' }}
          px={{ base: '1.75rem', md: '0' }}
          py={{ base: '1rem', md: '0' }}
        />
        <CoverExcerpt excerpt={item.excerpt} />
      </Link>
    </Box>
  )
}
