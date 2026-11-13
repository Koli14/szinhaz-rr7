import { Box, Flex, Heading } from '@chakra-ui/react'
import { Link } from '~/components/Link'
import { Tag } from '~/components/Tags'
import type { PostPreview } from '~/types'

// `prefetch='viewport'` loads the post as soon as the item is on screen
// (only for the first items of the home page: phones have no hover)
export const CoverItem = ({
  item,
  prefetch,
}: {
  item: PostPreview
  prefetch?: 'viewport'
}) => {
  const image = item.featuredImage?.node
  const thumbnail = image?.mediaDetails.sizes.find(
    (s) => s.name === 'thumbnail',
  )
  const src = thumbnail?.sourceUrl ?? image?.sourceUrl
  const tag = item.kiemeltCimke.featuredTag?.nodes?.[0] ?? item.tags.nodes[0]

  return (
    <Flex
      as='article'
      mx={{ base: '0.5rem', lg: 'auto' }}
      my={{ base: '1rem', lg: 'auto' }}
      direction={{ base: 'row', md: 'column' }}
    >
      {src && (
        <Box
          display={{ base: 'block', md: 'none' }}
          minWidth='100px'
          minHeight='100px'
          mx='1rem'
        >
          <Link to={item.uri ?? `/${item.slug}/`} prefetch={prefetch}>
            <Box aspectRatio={1} overflow='hidden' width='100%'>
              <img
                src={src}
                alt={image?.altText}
                title={image?.title}
                // Without it React preloads every thumbnail in <head>,
                // on desktop too, where they are not shown at all
                loading='lazy'
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Link>
        </Box>
      )}
      <Flex flexGrow={1} direction='column'>
        {tag && (
          <Box mb='6px'>
            <Tag tag={tag} />
          </Box>
        )}
        <Link to={item.uri ?? `/${item.slug}/`} prefetch={prefetch}>
          <CoverHeading title={item.title} />
          <CoverExcerpt excerpt={item.excerpt} />
        </Link>
      </Flex>
    </Flex>
  )
}

export const CoverHeading = ({
  title,
  ...props
}: { title: string } & React.ComponentProps<typeof Heading>) => (
  <Heading
    width='100%'
    as='h2'
    fontFamily='heading'
    fontSize={{ base: '1.0625rem', md: '1.375rem' }}
    lineHeight='1.25'
    fontWeight='400'
    pb={{ base: '1rem', md: '0' }}
    dangerouslySetInnerHTML={{ __html: title }}
    {...props}
  />
)

export const CoverExcerpt = ({ excerpt }: { excerpt: string }) => (
  <Box
    display={{ base: 'none', md: 'block' }}
    mt='10px'
    mb='16px'
    flex={1}
    color='gray.700'
    dangerouslySetInnerHTML={{ __html: excerpt }}
  />
)
