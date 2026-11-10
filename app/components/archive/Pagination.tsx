import { Box } from '@chakra-ui/react'
import { Link } from '~/components/Link'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import type { PageInfo } from '~/types'

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 20px',
  minHeight: '52px',
  cursor: 'pointer',
  background: '#F4A91C',
  color: 'white',
  border: '1px solid transparent',
  textTransform: 'uppercase',
  fontSize: '1rem',
  textDecoration: 'none',
  transition: 'all 0.2s',
}

export function Pagination({
  pageInfo,
  basePath,
  olderLabel = 'Régebbi hírek',
}: {
  pageInfo: PageInfo
  basePath: string
  olderLabel?: string
}) {
  const olderUrl =
    pageInfo.hasNextPage && pageInfo.endCursor
      ? `${basePath}?after=${encodeURIComponent(pageInfo.endCursor)}`
      : null

  if (!olderUrl) return null

  return (
    <Box display='flex' mt='56px' justifyContent='center' gap='4'>
      <Link to={olderUrl} style={buttonStyle}>
        <Box as={BsChevronRight} mr='2' />
        {olderLabel}
      </Link>
    </Box>
  )
}
