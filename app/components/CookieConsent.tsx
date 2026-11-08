import { Box, Flex } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

// Same cookie as the react-cookie-consent banner on the Frontity site, so
// visitors who already accepted it don't see the notice again.
const COOKIE = 'CookieConsent'
const MAX_AGE = 999 * 24 * 60 * 60

export function CookieConsent() {
  // Rendered only after hydration: the server can't know the cookie state
  // of cached pages.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(
      !document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE}=`)),
    )
  }, [])

  if (!visible) return null

  const accept = () => {
    document.cookie = `${COOKIE}=true; max-age=${MAX_AGE}; path=/; SameSite=Lax`
    setVisible(false)
  }

  return (
    <Flex
      role='region'
      aria-label='Cookie tájékoztató'
      position='fixed'
      bottom='0'
      left='0'
      right='0'
      zIndex='overlay'
      bg='rgba(53, 53, 53, 0.75)'
      color='white'
      fontSize='13px'
      alignItems='center'
      justifyContent='space-between'
      flexWrap='wrap'
      gap='3'
      px='4'
      py='3'
    >
      <Box flex='1 1 300px'>
        Kedves olvasó, az Ön adatainak védelme fontos számunkra. Ezért
        tájékoztatjuk, ha az oldalon jár, azzal elfogadja, hogy a Színház Online
        látogatottságának elemzéséhez cookie-k segítségét veszi igénybe.{' '}
        <Box asChild color='#eda304'>
          <Link to='/adatkezelesi-tajekoztato/'>További információ</Link>
        </Box>
      </Box>
      <Box
        as='button'
        onClick={accept}
        bg='#eda304'
        color='white'
        fontFamily='heading'
        px='4'
        py='1.5'
        cursor='pointer'
      >
        Értem
      </Box>
    </Flex>
  )
}
