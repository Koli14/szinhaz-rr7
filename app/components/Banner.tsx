import { Box } from '@chakra-ui/react'
import type { BannerSlot } from '~/types'

export function Banner({
  banner,
  aspectRatio,
  maxWidth,
  mt = '20px',
  mb,
}: {
  banner: BannerSlot | null | undefined
  aspectRatio?: number
  maxWidth?: string
  mt?: string
  mb?: string
}) {
  if (!banner?.kep?.sourceUrl) return null
  const href = banner.link?.url ?? '#'

  return (
    <Box mt={mt} mb={mb} maxWidth={maxWidth ?? '100%'} mx='auto'>
      <a href={href} target='_blank' rel='noopener noreferrer'>
        {aspectRatio ? (
          <Box aspectRatio={aspectRatio} overflow='hidden'>
            <img
              src={banner.kep.sourceUrl}
              alt='banner'
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        ) : (
          <img
            src={banner.kep.sourceUrl}
            alt='banner'
            style={{ width: '100%' }}
          />
        )}
      </a>
    </Box>
  )
}
