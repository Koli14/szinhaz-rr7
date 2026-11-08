import { Box } from '@chakra-ui/react'
import type { GateBannerData } from '~/types'

export const GateBanner = ({ banners }: { banners: GateBannerData }) => {
  const { kep, link } = banners.gatebanner ?? {}
  const mobileKep = banners.gatebannermobile.kep

  if (!kep) return null

  const href = link?.url ?? '#'

  return (
    <Box position={{ base: 'static', md: 'fixed' }} top='0' left='0' right='0'>
      <a href={href} target='_blank' rel='noopener noreferrer'>
        <Box display={{ base: 'none', md: 'block' }}>
          <img
            src={kep.sourceUrl}
            alt='gate banner'
            style={{ objectFit: 'cover', width: '100%', objectPosition: 'top' }}
          />
        </Box>
        {mobileKep && (
          <Box display={{ base: 'block', md: 'none' }}>
            <img
              src={mobileKep.sourceUrl}
              alt='gate banner'
              style={{ width: '100%' }}
            />
          </Box>
        )}
      </a>
    </Box>
  )
}
