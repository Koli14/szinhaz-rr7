import { Box, Flex } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { IoLogoFacebook } from 'react-icons/io5'
import { useMatches, useRouteLoaderData } from 'react-router'
import { Instagram } from '~/components/Instagram'
import type { InstaPost } from '~/components/Instagram'
import { Link } from '~/components/Link'
import SocialNav from '~/components/header/SocialNav'
import type { loader as homeLoader } from '~/routes/home'

const MENU = [
  ['/kapcsolat/', 'Kapcsolat'],
  ['/impresszum/', 'Impresszum'],
  ['/mediaajanlat/', 'Médiaajánlat'],
  ['/adatkezelesi-tajekoztato/', 'Adatvédelmi irányelvek'],
] as const

const LOGOS = [
  ['https://www.imedia.hu/', '/images/imedia.svg', 'imedia'],
  ['https://www.nka.hu/', '/images/NKA_logo.png', 'Nemzeti Kulturális Alap'],
  ['https://emmiugyfelszolgalat.gov.hu/', '/images/eem.png', 'EMMI'],
] as const

function FooterMenuItem({
  first,
  children,
}: {
  first: boolean
  children: React.ReactNode
}) {
  return (
    <Box
      as='li'
      px='18px'
      ml={first ? 0 : '-1px'}
      borderLeft={first ? 'none' : '1px solid black'}
      whiteSpace='nowrap'
      transition='opacity 0.5s ease'
      _hover={{ opacity: 0.5 }}
    >
      {children}
    </Box>
  )
}

const DESKTOP = '(min-width: 48em)'

// Instagram block, as in the Frontity footer: on every page on phones, on
// desktop only on the home page and the 404 page. The home page brings the
// posts in its data, other pages load them once in the browser.
function useFooterInstagram() {
  const matches = useMatches()
  const leaf = matches[matches.length - 1]
  const home = useRouteLoaderData<typeof homeLoader>('routes/home')
  // A route that failed (404) has no data
  const onDesktop = leaf?.id === 'routes/home' || leaf?.data == null
  const [loaded, setLoaded] = useState<InstaPost[] | null>(null)
  const needsFetch =
    !home && loaded === null && (onDesktop || !matchesDesktop())

  useEffect(() => {
    if (!needsFetch) return
    let active = true
    fetch('/api/instagram')
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then((posts: InstaPost[]) => {
        if (active) setLoaded(posts)
      })
    return () => {
      active = false
    }
  }, [needsFetch])

  return { posts: home?.instagram ?? loaded ?? [], onDesktop }
}

const matchesDesktop = () =>
  typeof window !== 'undefined' && window.matchMedia(DESKTOP).matches

export function Footer() {
  const instagram = useFooterInstagram()

  return (
    // Positioned above the fixed gate banner, which otherwise covers the
    // footer on tall desktop windows
    <Box
      as='footer'
      position='relative'
      zIndex={1}
      bg='white'
      mt={{ base: '0', md: '50px' }}
    >
      <Instagram
        posts={instagram.posts}
        display={{ base: 'block', md: instagram.onDesktop ? 'block' : 'none' }}
      />

      <Box asChild display={{ base: 'block', md: 'none' }}>
        <a
          href='https://facebook.com/szinhazonline/'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Flex
            bg='#D6AD7D'
            color='white'
            justifyContent='center'
            alignItems='center'
            fontSize={{ base: '21px', sm: '26px' }}
            py='33px'
          >
            HÍREINKET ITT IS KÖVETHETI:
            <Box as={IoLogoFacebook} ml='5px' boxSize='30px' />
          </Flex>
        </a>
      </Box>

      <Box
        pt='22px'
        borderTop={{ base: '0', md: '2px solid black' }}
        mx='auto'
        px={{ base: 0, md: '1.875rem' }}
      >
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          alignItems={{ base: 'flex-start', md: 'center' }}
          justifyContent='space-between'
        >
          <Flex
            fontSize='12px'
            order={{ base: 2, md: 0 }}
            bg={{ base: '#F4A91C', md: 'transparent' }}
            width={{ base: '100%', md: 'auto' }}
            p='28px'
          >
            © {new Date().getFullYear()} szinhaz.online
          </Flex>

          <Flex
            as='ul'
            order={{ base: 0, md: 1 }}
            py={{ base: '0', md: '10px' }}
            justifyContent={{ base: 'flex-start', md: 'center' }}
            listStyleType='none'
            align='center'
            flexWrap='wrap'
            fontFamily="'Bellefair', serif"
            letterSpacing='1.6px'
            fontSize='16px'
            textTransform='uppercase'
          >
            {MENU.map(([to, name], i) => (
              <FooterMenuItem key={to} first={i === 0}>
                <Link to={to}>{name}</Link>
              </FooterMenuItem>
            ))}
          </Flex>

          <Flex
            order={2}
            py='10px'
            alignItems='center'
            display={{ base: 'none', md: 'flex' }}
          >
            <SocialNav />
          </Flex>

          <Flex
            order={{ base: 1, md: 3 }}
            alignItems='center'
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
            flexShrink={0}
            maxWidth='100%'
            px={{ base: '18px', md: '0' }}
          >
            {LOGOS.map(([href, src, alt]) => (
              <a
                key={href}
                href={href}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Box
                  asChild
                  maxHeight='80px'
                  // Smaller on narrow desktops (62–80em), where the footer is
                  // one row and the logos pushed it past the window
                  maxWidth={{
                    base: 'min(200px, 30vw)',
                    md: '200px',
                    lg: 'min(200px, 13vw)',
                    xl: '200px',
                  }}
                >
                  <img src={src} alt={alt} loading='lazy' />
                </Box>
              </a>
            ))}
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}
