import { Box, Flex } from '@chakra-ui/react'
import { IoLogoInstagram } from 'react-icons/io5'

export type InstaPost = { id: string; url: string; thumbnail: string }

const PROFILE = 'https://www.instagram.com/szinhaz.online/'

// "Színházi pillanatok az Instagramon" heading with the latest 8 posts
// (4 on mobile). The grid is left out when the feed is unavailable.
export function Instagram({ posts }: { posts: InstaPost[] }) {
  return (
    <Box as='section' mt={{ base: '0', md: '50px' }}>
      <Flex
        asChild
        maxWidth='1210px'
        mx='auto'
        alignItems='center'
        flexDirection='column'
      >
        <a href={PROFILE} target='_blank' rel='noopener noreferrer'>
          <Box
            as={IoLogoInstagram}
            display={{ base: 'block', md: 'none' }}
            boxSize='35px'
            mt='26px'
            mb='12px'
            color='#DDDDDD'
          />
          <Flex
            alignItems='center'
            justifyContent='center'
            mb={{ base: '25px', md: '50px' }}
            mx='4'
            fontSize={{ base: '25px', md: '20px' }}
            textAlign='center'
            fontFamily={{ base: 'heading', md: "'Bellefair', serif" }}
            textTransform='uppercase'
            color={{ base: '#F4A91C', md: 'black' }}
          >
            <Box display={{ base: 'none', md: 'block' }}>-&nbsp;</Box>
            Színházi pillanatok az Instagramon
            <Box display={{ base: 'none', md: 'block' }}>&nbsp;-</Box>
          </Flex>
        </a>
      </Flex>

      {posts.length > 0 && (
        <Flex flexWrap='wrap' maxWidth='1210px' mx='auto'>
          {posts.slice(0, 8).map((post, index) => (
            <Box
              key={post.id}
              asChild
              w={{ base: '50%', md: '25%' }}
              display={{ base: index < 4 ? 'block' : 'none', md: 'block' }}
              pr={{ base: index % 2 === 0 ? '2px' : '0', md: '0' }}
              pl={{ base: index % 2 === 1 ? '2px' : '0', md: '0' }}
              pb={{ base: '4px', md: '0' }}
            >
              <a href={post.url} target='_blank' rel='noopener noreferrer'>
                <Box aspectRatio={1} overflow='hidden'>
                  <img
                    src={post.thumbnail}
                    alt='Instagram'
                    loading='lazy'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              </a>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  )
}
