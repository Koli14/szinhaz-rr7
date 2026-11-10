import { Box, Flex } from '@chakra-ui/react'
import { Link } from '~/components/Link'
import Menu from './Menu'
import MobileMenu from './MobileMenu'
import SearchButton from './SearchButton'
import SocialNav from './SocialNav'
import TagCloud from './TagCloud'
import type { FlatMenuItem, Tag } from '~/types'

export type HeaderProps = {
  tagClouds: Tag[]
  menuItems: FlatMenuItem[]
  hasGateBanner: boolean
  onSearchOpen?: () => void
  onDrawerOpen?: () => void
}

export function Header({
  tagClouds,
  menuItems,
  hasGateBanner,
  onSearchOpen,
  onDrawerOpen,
}: HeaderProps) {
  const dateToday = new Date().toLocaleString('hu-HU', {
    timeZone: 'Europe/Budapest',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Box
      as='header'
      transition='transform ease .25s'
      maxWidth='1210px'
      width='100%'
      position='relative'
      top={hasGateBanner ? { base: '3', md: '250px' } : '3'}
      ml='auto'
      mr='auto'
    >
      <Flex
        alignItems='center'
        direction='column'
        bg='white'
        pb='7px'
        pt={{ base: 0, lg: '3' }}
      >
        <Flex
          w='100%'
          alignItems='center'
          justifyContent='space-between'
          mb='5'
          px={{ md: '1.875rem' }}
        >
          <Flex alignItems='center'>
            <SiteLogo />
            <TagCloud tagClouds={tagClouds} />
          </Flex>
          <Flex direction='column'>
            <MobileMenu onClick={onDrawerOpen} />
            <Flex display={{ base: 'none', lg: 'flex' }}>
              <SearchButton onClick={onSearchOpen} />
              <SocialNav />
            </Flex>
            <Box
              mt='10px'
              mx='0.6rem'
              color='#9D9D9D'
              textTransform='uppercase'
              fontSize='13px'
              display={{ base: 'none', lg: 'block' }}
              // a cached page can be from yesterday: the browser's date wins
              suppressHydrationWarning
            >
              {dateToday}
            </Box>
          </Flex>
        </Flex>
        <Menu menuItems={menuItems} />
      </Flex>
    </Box>
  )
}

function SiteLogo() {
  return (
    <Box display='block' flexShrink={0} ml={{ base: '25px', md: '0' }}>
      <Link to='/'>
        <img
          src='/images/szinhaz_logo.png'
          width='200'
          alt='Színház Online'
          style={{ transform: 'translateZ(0)' }}
        />
      </Link>
    </Box>
  )
}
