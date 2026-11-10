import { Box } from '@chakra-ui/react'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { Link } from '~/components/Link'

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  minHeight: '52px',
  background: '#F4A91C',
  color: 'white',
  textTransform: 'uppercase',
  fontSize: '1rem',
  textDecoration: 'none',
}

// "Újabb hírek" / "Régebbi hírek" buttons of numbered list pages
export function PageNav({
  page,
  hasNextPage,
  pageUrl,
}: {
  page: number
  hasNextPage: boolean
  pageUrl: (page: number) => string
}) {
  if (page <= 1 && !hasNextPage) return null

  return (
    <Box display='flex' mt='56px' justifyContent='center' gap='4'>
      {page > 1 && (
        <Link to={pageUrl(page - 1)} style={buttonStyle}>
          <Box as={BsChevronLeft} mr='2' />
          Újabb hírek
        </Link>
      )}
      {hasNextPage && (
        <Link to={pageUrl(page + 1)} style={buttonStyle}>
          Régebbi hírek
          <Box as={BsChevronRight} ml='2' />
        </Link>
      )}
    </Box>
  )
}
