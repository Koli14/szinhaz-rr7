import { Box, Heading, Text } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { Tag } from '~/components/Tags'
import { formatDate } from '~/utils/helpers'
import type { Tag as TagType } from '~/types'

type PostHeaderProps = {
  title: string
  tag?: TagType | null
  date?: string | null
} & BoxProps

// Title block of posts and pages; pages have no tag and no date
export const PostHeader = ({ title, tag, date, ...props }: PostHeaderProps) => (
  <Box {...props}>
    {tag && <Tag tag={tag} />}
    <Heading
      as='h1'
      fontWeight='bold'
      lineHeight='1.25'
      size='lg'
      fontSize={{ base: '1.0625rem', lg: '1.875rem' }}
      mt='5'
      mb={{ base: '3', lg: '3' }}
      textTransform='uppercase'
      dangerouslySetInnerHTML={{ __html: title }}
    />
    {date && (
      <Text fontSize={{ base: '0.75rem', lg: '1rem' }} mt='12px'>
        {formatDate(date)}
      </Text>
    )}
  </Box>
)
