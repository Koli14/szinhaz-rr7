import { Box, Flex, Heading } from '@chakra-ui/react'
import { CoverItem } from '~/components/home/CoverItem'
import { FeaturedItem } from '~/components/home/FeaturedItem'
import { Link } from '~/components/Link'
import { Tag } from '~/components/Tags'
import { POST_IMAGE_WIDTHS, responsiveImage } from '~/utils/images'
import type { PostPreview } from '~/types'

// One archive entry, laid out like Frontity: a wide image + text row on
// desktop (the first entry of each page is bigger), the home page cover
// items on phones.
export function ArchiveItem({
  item,
  featured = false,
}: {
  item: PostPreview
  featured?: boolean
}) {
  return (
    <>
      <Box display={{ base: 'block', md: 'none' }}>
        {featured ? <FeaturedItem item={item} /> : <CoverItem item={item} />}
      </Box>
      <DesktopItem item={item} featured={featured} />
    </>
  )
}

function DesktopItem({
  item,
  featured,
}: {
  item: PostPreview
  featured: boolean
}) {
  const image = item.featuredImage?.node
  const img = image?.sourceUrl
    ? responsiveImage(image.sourceUrl, POST_IMAGE_WIDTHS)
    : null
  // The image takes 11/20 (first entry) or 1/3 of the row
  const sizes = featured
    ? '(min-width: 48rem) 55vw, 100vw'
    : '(min-width: 48rem) 33vw, 100vw'
  const tag = item.kiemeltCimke.featuredTag?.nodes?.[0] ?? item.tags.nodes[0]
  const to = item.uri ?? `/${item.slug}/`

  return (
    <Flex
      as='article'
      display={{ base: 'none', md: 'flex' }}
      direction='row'
      position='relative'
      py='5'
    >
      {img && (
        <Box asChild display='block' flex={featured ? '11' : '1'}>
          <Link to={to}>
            <Box aspectRatio={9 / 5} overflow='hidden'>
              <img
                src={img.src}
                srcSet={img.srcSet}
                sizes={sizes}
                alt={image?.altText}
                loading='lazy'
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Link>
        </Box>
      )}
      <Flex px='40px' flex={featured ? '9' : '2'} direction='column'>
        {tag && (
          <Flex mb='6px'>
            <Tag tag={tag} />
          </Flex>
        )}
        <Heading
          as='h2'
          fontFamily='heading'
          fontSize={featured ? '1.6875rem' : '1.375rem'}
          fontWeight='500'
          lineHeight='1.25'
          textTransform='uppercase'
        >
          <Link to={to} dangerouslySetInnerHTML={{ __html: item.title }} />
        </Heading>
        <Box
          my='3'
          flex='1'
          dangerouslySetInnerHTML={{ __html: item.excerpt }}
        />
      </Flex>
    </Flex>
  )
}
