import { Box } from '@chakra-ui/react'
import {
  DESKTOP_MEDIA,
  GATE_BANNER_MOBILE_WIDTHS,
  GATE_BANNER_WIDTHS,
  responsiveImage,
} from '~/utils/images'
import type { GateBannerData } from '~/types'

// 1×1 transparent GIF: phones without a mobile banner download nothing
const EMPTY =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

// One <picture>, so each device downloads only its own banner. Two <img>s
// hidden with CSS both downloaded (phones got the 141 KB desktop banner too).
export const GateBanner = ({ banners }: { banners: GateBannerData }) => {
  const { kep, link } = banners.gatebanner ?? {}
  const mobileKep = banners.gatebannermobile.kep

  if (!kep) return null

  const href = link?.url ?? '#'
  const desktop = responsiveImage(kep.sourceUrl, GATE_BANNER_WIDTHS)
  const mobile = mobileKep
    ? responsiveImage(mobileKep.sourceUrl, GATE_BANNER_MOBILE_WIDTHS)
    : null

  return (
    <Box
      position={{ base: 'static', md: 'fixed' }}
      top='0'
      left='0'
      right='0'
      display={{ base: mobile ? 'block' : 'none', md: 'block' }}
    >
      <a href={href} target='_blank' rel='noopener noreferrer'>
        <picture>
          <source
            media={DESKTOP_MEDIA}
            srcSet={desktop.srcSet ?? desktop.src}
            sizes='100vw'
          />
          <img
            src={mobile?.src ?? EMPTY}
            srcSet={mobile?.srcSet}
            sizes='100vw'
            alt='hirdetés'
            style={{
              display: 'block',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
            }}
          />
        </picture>
      </a>
    </Box>
  )
}
