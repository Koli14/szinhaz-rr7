import { Box } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { FolderPostItem } from '~/components/home/Folders'
import type { FolderPost } from '~/components/home/Folders'

// "TOVÁBBI HÍREK": the posts picked on the "Kapcsolódó cikkek" options page
export function RelatedPosts({
  posts,
  ...props
}: { posts: FolderPost[] } & BoxProps) {
  if (!posts.length) return null

  return (
    <Box as='aside' bg='#F8F1E9' px='29px' pb='3' {...props}>
      <Box
        as='h2'
        display='inline-block'
        my='30px'
        p='9px 30px'
        border='1px solid #D6AD7D'
        bg='white'
        color='#D6AD7D'
        fontWeight='800'
      >
        TOVÁBBI HÍREK
      </Box>
      {posts.map((post) => (
        <FolderPostItem key={post.uri} post={post} />
      ))}
    </Box>
  )
}
