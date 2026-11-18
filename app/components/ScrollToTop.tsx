import { Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { IoArrowUpSharp } from 'react-icons/io5'

const SHOW_AFTER = 400

// The Frontity theme's "back to top" arrow: on phones, once the page has
// been scrolled down 400px
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <Box
      asChild
      display={{ base: visible ? 'flex' : 'none', md: 'none' }}
      position='fixed'
      bottom='24px'
      right='24px'
      zIndex='docked'
      boxSize='40px'
      alignItems='center'
      justifyContent='center'
      bg='white'
      color='#F4A91C'
      cursor='pointer'
    >
      <button
        type='button'
        aria-label='Vissza az oldal tetejére'
        title='Vissza az oldal tetejére'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <Box as={IoArrowUpSharp} boxSize='40px' />
      </button>
    </Box>
  )
}
