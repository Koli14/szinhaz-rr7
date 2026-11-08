import { Box } from '@chakra-ui/react'
import { Link } from 'react-router'
import { Carousel } from '~/components/Carousel'

export type HomeQuote = {
  content: string
  name: string | null
  link: string
}

export function Quotes({ quotes }: { quotes: HomeQuote[] }) {
  if (!quotes.length) return null

  return (
    <Box
      as='section'
      bg={{ base: '#F4A91C', md: 'primary.50' }}
      textAlign='center'
      px={{ base: '5%', md: '20%' }}
      my='5'
    >
      <Carousel label='Idézetek' arrowColor={{ base: 'white', md: '#9D9D9D' }}>
        {quotes.map((quote, i) => (
          <Box
            key={i}
            asChild
            display='block'
            p='3'
            color={{ base: 'white', md: '#5F5F5F' }}
          >
            <Link to={quote.link}>
              <Box
                fontFamily='heading'
                fontStyle='italic'
                lineHeight='1.25'
                fontSize={{ base: '20px', md: '28px' }}
                mt={{ base: '20px', md: '55px' }}
                dangerouslySetInnerHTML={{ __html: quote.content }}
              />
              {quote.name && (
                <Box
                  mt='20px'
                  mb='25px'
                  textTransform='uppercase'
                  fontSize='16px'
                  fontFamily="'Open Sans', sans-serif"
                >
                  {quote.name}
                </Box>
              )}
            </Link>
          </Box>
        ))}
      </Carousel>
    </Box>
  )
}
