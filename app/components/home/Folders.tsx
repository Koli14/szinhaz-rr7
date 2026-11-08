import { Box, Flex, Heading } from '@chakra-ui/react'
import { Link } from 'react-router'

export type FolderPost = {
  title: string
  uri: string
  excerpt: string
  image: { src: string; alt: string } | null
}

export type HomeFolder = {
  name: string
  slug: string
  color: string | null
  posts: FolderPost[]
}

// Two folder columns side by side (stacked on mobile)
export function FolderRow({
  left,
  right,
}: {
  left: HomeFolder[]
  right: HomeFolder[]
}) {
  if (!left.length && !right.length) return null

  return (
    <Flex
      as='section'
      flexDir={{ base: 'column', md: 'row' }}
      overflowX='hidden'
    >
      <FolderColumn folders={left} mr={{ base: 0, md: 3 }} />
      <FolderColumn folders={right} ml={{ base: 0, md: 3 }} />
    </Flex>
  )
}

function FolderColumn({
  folders,
  ...props
}: { folders: HomeFolder[] } & React.ComponentProps<typeof Box>) {
  return (
    <Box flex='1' {...props}>
      {folders.map((folder) => (
        <Folder key={folder.slug} folder={folder} />
      ))}
    </Box>
  )
}

function Folder({ folder }: { folder: HomeFolder }) {
  const color = folder.color ?? '#F4A91C'

  return (
    <Box
      _even={{ bg: { base: '#F8F1E9', md: 'transparent' } }}
      px={{ base: '1.5rem', md: '0' }}
    >
      <Box
        asChild
        display='inline-block'
        p='9px 19px'
        fontSize='13px'
        fontWeight='800'
        color={color}
        textTransform='uppercase'
        border='1px solid'
        borderColor={color}
        bg='white'
        mt={{ base: '30px', md: '0' }}
      >
        <Link to={`/folder/${folder.slug}/`}>{folder.name}</Link>
      </Box>
      <Box>
        {folder.posts.map((post, index) => (
          <FolderPostItem
            key={post.uri}
            post={post}
            hideOnMobile={index >= 6}
          />
        ))}
      </Box>
    </Box>
  )
}

function FolderPostItem({
  post,
  hideOnMobile,
}: {
  post: FolderPost
  hideOnMobile: boolean
}) {
  return (
    <Box
      asChild
      py='3'
      display={{ base: hideOnMobile ? 'none' : 'block', md: 'block' }}
    >
      <Link to={post.uri}>
        <Flex>
          {post.image ? (
            <img
              src={post.image.src}
              alt={post.image.alt}
              loading='lazy'
              width={114}
              height={114}
              style={{ width: 114, height: 114, objectFit: 'cover' }}
            />
          ) : (
            <Box w='114px' h='114px' flexShrink={0} bg='gray.100' />
          )}
          <Flex direction='column' px='5' w='calc(100% - 115px)'>
            <Heading
              as='h4'
              fontSize={{ base: '1.25rem', md: '22px' }}
              lineHeight='1.25'
              fontWeight='400'
              fontFamily='heading'
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
            <Box
              display={{ base: 'none', lg: 'block' }}
              fontSize='14px'
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />
          </Flex>
        </Flex>
      </Link>
    </Box>
  )
}
