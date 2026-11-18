import { Box } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { Link } from '~/components/Link'

// The Frontity buttons: both are always there, the one without a page is
// pale and does nothing, the active ones turn white on hover
const buttonProps: BoxProps = {
  display: 'flex',
  alignItems: 'center',
  px: '14px',
  py: '10px',
  minHeight: '60px',
  bg: '#eca419',
  color: 'white',
  border: '1px solid transparent',
  textTransform: 'uppercase',
  textDecoration: 'none',
}

const activeProps: BoxProps = {
  ...buttonProps,
  cursor: 'pointer',
  _hover: { bg: 'white', color: '#eca419', borderColor: '#eca419' },
}

const disabledProps: BoxProps = { ...buttonProps, bg: '#FFCE71' }

function PageButton({
  to,
  label,
  direction,
}: {
  to: string | null
  label: string
  direction: 'newer' | 'older'
}) {
  const content =
    direction === 'newer' ? (
      <>
        <Box as={BsChevronLeft} w='20px' mr={{ base: '5px', sm: '15px' }} />
        <Box mr={{ base: '0', sm: '20px' }}>{label}</Box>
      </>
    ) : (
      <>
        <Box ml={{ base: '0', sm: '20px' }}>{label}</Box>
        <Box as={BsChevronRight} w='20px' ml={{ base: '5px', sm: '15px' }} />
      </>
    )

  if (!to) {
    return (
      <Box {...disabledProps} aria-disabled='true'>
        {content}
      </Box>
    )
  }
  return (
    <Box asChild {...activeProps}>
      <Link to={to} prefetch='viewport'>
        {content}
      </Link>
    </Box>
  )
}

// "Újabb hírek" / "Régebbi hírek" buttons of numbered list pages
export function PageNav({
  page,
  hasNextPage,
  pageUrl,
  newerLabel = 'Újabb hírek',
  olderLabel = 'Régebbi hírek',
}: {
  page: number
  hasNextPage: boolean
  pageUrl: (page: number) => string
  newerLabel?: string
  olderLabel?: string
}) {
  if (page <= 1 && !hasNextPage) return null

  return (
    <Box
      as='nav'
      aria-label='Lapozás'
      display='flex'
      mt='56px'
      justifyContent='space-evenly'
      fontSize={{ base: '1rem', sm: '1.2rem' }}
    >
      <PageButton
        to={page > 1 ? pageUrl(page - 1) : null}
        label={newerLabel}
        direction='newer'
      />
      <PageButton
        to={hasNextPage ? pageUrl(page + 1) : null}
        label={olderLabel}
        direction='older'
      />
    </Box>
  )
}
