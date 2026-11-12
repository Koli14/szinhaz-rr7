import { Box } from '@chakra-ui/react'
import { BANNER_WIDTHS, responsiveImage } from '~/utils/images'
import type { BannerSlot } from '~/types'

export function Banner({
  banner,
  aspectRatio,
  maxWidth,
  mt = '20px',
  mb,
  sizes = '(min-width: 64rem) 66vw, 100vw',
}: {
  banner: BannerSlot | null | undefined
  aspectRatio?: number
  maxWidth?: string
  mt?: string
  mb?: string
  // Rendered width, for picking the image variant
  sizes?: string
}) {
  if (!banner?.kep?.sourceUrl) return null
  const href = banner.link?.url ?? '#'
  const img = responsiveImage(banner.kep.sourceUrl, BANNER_WIDTHS)

  return (
    <Box mt={mt} mb={mb} maxWidth={maxWidth ?? '100%'} mx='auto'>
      <a href={href} target='_blank' rel='noopener noreferrer'>
        {aspectRatio ? (
          <Box aspectRatio={aspectRatio} overflow='hidden'>
            <img
              src={img.src}
              srcSet={img.srcSet}
              sizes={sizes}
              alt='banner'
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        ) : (
          <img
            src={img.src}
            srcSet={img.srcSet}
            sizes={sizes}
            alt='banner'
            style={{ width: '100%' }}
          />
        )}
      </a>
    </Box>
  )
}
