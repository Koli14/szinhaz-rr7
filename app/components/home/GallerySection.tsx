import { Box, Flex } from '@chakra-ui/react'
import { Link } from 'react-router'
import { Carousel } from '~/components/Carousel'

export type HomeGallery = {
  title: string
  uri: string
  image: { src: string; alt: string } | null
}

const labelProps = {
  fontWeight: '800',
  fontSize: '13px',
  letterSpacing: '0.65px',
} as const

export function GallerySection({ galleries }: { galleries: HomeGallery[] }) {
  if (!galleries.length) return null

  return (
    <Box as='section'>
      <Box mt='2rem' mb='0.3rem' mx='0.5rem'>
        <Box asChild {...labelProps} color='#F4A91C'>
          <Link to='/galeria/'>SZÍNHÁZI FOTÓK</Link>
        </Box>
      </Box>
      <Box textAlign='center' mb='1'>
        <Carousel label='Galériák' perView={3}>
          {galleries.map((gallery) => (
            <GalleryThumb key={gallery.uri} gallery={gallery} />
          ))}
        </Carousel>
      </Box>
      <Flex justify='flex-end' mb='2rem' display={{ base: 'none', md: 'flex' }}>
        <Box
          asChild
          {...labelProps}
          display='inline-block'
          p='9px 19px'
          mr='5px'
          bg='#F4A91C'
          color='white'
        >
          <Link to='/galeria/'>TOVÁBBI GALÉRIÁK</Link>
        </Box>
      </Flex>
    </Box>
  )
}

function GalleryThumb({ gallery }: { gallery: HomeGallery }) {
  return (
    <Box
      asChild
      display='block'
      w='100%'
      py='3'
      pr={{ base: 0, md: '5px' }}
      position='relative'
    >
      <Link to={gallery.uri}>
        {gallery.image ? (
          <img
            src={gallery.image.src}
            alt={gallery.image.alt || gallery.title}
            loading='lazy'
            style={{ width: '100%', height: '226px', objectFit: 'cover' }}
          />
        ) : (
          <Box h='226px' bg='gray.200' />
        )}
        <Box
          _hover={{ opacity: '1' }}
          opacity={{ base: '1', md: '0' }}
          transition='opacity 0.2s'
          color='white'
          position='absolute'
          inset='0'
        >
          <Box
            position='absolute'
            bottom='40px'
            left='30px'
            right='30px'
            textShadow='0 1px 0 black'
            fontFamily='heading'
            fontSize='18px'
            textAlign='left'
            dangerouslySetInnerHTML={{ __html: gallery.title }}
          />
        </Box>
      </Link>
    </Box>
  )
}
