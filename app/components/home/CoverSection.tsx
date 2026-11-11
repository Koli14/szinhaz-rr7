import { Box } from '@chakra-ui/react'
import { Fragment } from 'react'
import { useRouteLoaderData } from 'react-router'
import { AdSense, AD_SLOTS } from '~/components/AdSense'
import { Banner } from '~/components/Banner'
import { CoverItem } from './CoverItem'
import { FeaturedItem } from './FeaturedItem'
import type { PostPreview } from '~/types'

const BIG = 100 / 30
// Lead stories below the featured ones that load as soon as they are on
// screen; the rest of the home page prefetches on hover/touch
const VIEWPORT_PREFETCH = 3
const LITTLE = 100 / 48

function useBanners() {
  const root = useRouteLoaderData<typeof import('../../root').loader>('root')
  return root?.banners ?? null
}

// Banner and ad placements follow the Frontity home page: big banners 1-2
// after the second list item on the left, 3-4 and the big ads below the left
// column, little banner 1 after the first list item on the right and little
// banner 2 at the bottom of the right column.
export const LeftCoverItems = ({
  featuredItems,
  items,
}: {
  featuredItems: PostPreview[]
  items: PostPreview[]
}) => {
  const banners = useBanners()
  const ads = banners?.adsense

  return (
    <Box flex={2} mr={{ base: 0, lg: 3 }}>
      <FeaturedItem item={featuredItems[0]} />
      <FeaturedItem item={featuredItems[1]} mobileOnly />
      {items.map((item, i) => (
        <Fragment key={item.slug}>
          <CoverItem
            item={item}
            prefetch={i < VIEWPORT_PREFETCH ? 'viewport' : undefined}
          />
          {i === 1 && (
            <>
              <Banner banner={banners?.bigbanner1} aspectRatio={BIG} />
              <Banner banner={banners?.bigbanner2} aspectRatio={BIG} />
            </>
          )}
        </Fragment>
      ))}
      <Banner banner={banners?.bigbanner3} aspectRatio={BIG} />
      <Banner banner={banners?.bigbanner4} aspectRatio={BIG} />
      {ads?.homebigadsense1 && <AdSense slot={AD_SLOTS.homeBig1} />}
      {ads?.homebigadsense2 && <AdSense slot={AD_SLOTS.homeBig2} />}
    </Box>
  )
}

export const RightCoverItems = ({
  featuredItem,
  items,
}: {
  featuredItem: PostPreview
  items: PostPreview[]
}) => {
  const banners = useBanners()
  const ads = banners?.adsense

  return (
    <Box flex={1} ml={{ base: 0, lg: 3 }}>
      <FeaturedItem item={featuredItem} desktopOnly />
      {items.map((item, i) => (
        <Fragment key={item.slug}>
          <CoverItem item={item} />
          {i === 0 && (
            <>
              <Banner banner={banners?.littlebanner1} aspectRatio={LITTLE} />
              {ads?.homelittleadsense1 && (
                <AdSense slot={AD_SLOTS.homeLittle1} />
              )}
            </>
          )}
        </Fragment>
      ))}
      <Banner banner={banners?.littlebanner2} aspectRatio={LITTLE} />
      {ads?.homelittleadsense2 && <AdSense slot={AD_SLOTS.homeLittle2} />}
    </Box>
  )
}
