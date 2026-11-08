import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { useState } from 'react'
import type { Route } from './+types/root'
import { system } from './utils/theme'
import './app.css'
import { Header } from './components/header'
import { GateBanner } from './components/GateBanner'
import { Footer } from './components/Footer'
import { SearchModal } from './components/search/SearchModal'
import { MobileDrawer } from './components/header/MobileDrawer'
import { fetchFromGraphQL, gql } from './utils/graphql.server'
import type { Tag, FlatMenuItem, BannersData, BannerSlot } from './types'

// ─── GraphQL (menu, tag cloud, banners) ─────────────────────────────────────

type GqlImage = { node: { sourceUrl: string } } | null
type GqlSlot = { kep: GqlImage; link?: { url: string | null } | null } | null

type RootGqlData = {
  menuItems: { nodes: FlatMenuItem[] }
  tagCloud: { tagCloudFields: { tagCloud: { nodes: Tag[] } | null } | null }
  bannerek: {
    bannerFields: {
      adsense: Record<string, boolean | null> | null
      gateBanner: GqlSlot
      gateBannerMobile: GqlSlot
      bigBanner1: GqlSlot
      bigBanner2: GqlSlot
      bigBanner3: GqlSlot
      bigBanner4: GqlSlot
      littleBanner1: GqlSlot
      littleBanner2: GqlSlot
      whateverSizeBanner: GqlSlot
    } | null
  } | null
}

const SLOT = gql`kep { node { sourceUrl } } link { url }`

const GET_ROOT = gql`
  query getRoot {
    menuItems(first: 100, where: { location: PRIMARY }) {
      nodes {
        key: id
        parentId
        title: label
        uri
      }
    }
    tagCloud {
      tagCloudFields {
        tagCloud {
          nodes {
            name
            slug
            ... on Tag {
              taxonomyColor {
                taxColor
              }
            }
          }
        }
      }
    }
    bannerek {
      bannerFields {
        adsense {
          homeBigAdSense1
          homeBigAdSense2
          homeLittleAdSense1
          homeLittleAdSense2
          postBigAdSense1
          postBigAdSense1v2
          postBigAdSense1v3
          postBigAdSense2
          postLittleAdSense1
          postLittleAdSense1v2
          postLittleAdSense1v3
        }
        gateBanner { ${SLOT} }
        gateBannerMobile { kep { node { sourceUrl } } }
        bigBanner1 { ${SLOT} }
        bigBanner2 { ${SLOT} }
        bigBanner3 { ${SLOT} }
        bigBanner4 { ${SLOT} }
        littleBanner1 { ${SLOT} }
        littleBanner2 { ${SLOT} }
        whateverSizeBanner { ${SLOT} }
      }
    }
  }
`

function toSlot(slot: GqlSlot): BannerSlot | null {
  const url = slot?.kep?.node?.sourceUrl
  if (!url) return null
  const link = slot?.link?.url
  return { kep: { sourceUrl: url }, link: link ? { url: link } : null }
}

function toBanners(
  fields: NonNullable<RootGqlData['bannerek']>['bannerFields'],
): BannersData | null {
  if (!fields) return null
  const a = fields.adsense ?? {}
  return {
    gatebanner: toSlot(fields.gateBanner),
    gatebannermobile: { kep: toSlot(fields.gateBannerMobile)?.kep ?? null },
    bigbanner1: toSlot(fields.bigBanner1),
    bigbanner2: toSlot(fields.bigBanner2),
    bigbanner3: toSlot(fields.bigBanner3),
    bigbanner4: toSlot(fields.bigBanner4),
    littlebanner1: toSlot(fields.littleBanner1),
    littlebanner2: toSlot(fields.littleBanner2),
    whateversizebanner: toSlot(fields.whateverSizeBanner),
    adsense: {
      postbigadsense1: a.postBigAdSense1 ?? null,
      postbigadsense1_2: a.postBigAdSense1v2 ?? null,
      postbigadsense1_3: a.postBigAdSense1v3 ?? null,
      postbigadsense2: a.postBigAdSense2 ?? null,
      postlittleadsense1: a.postLittleAdSense1 ?? null,
      postlittleadsense1_2: a.postLittleAdSense1v2 ?? null,
      postlittleadsense1_3: a.postLittleAdSense1v3 ?? null,
      homebigadsense1: a.homeBigAdSense1 ?? null,
      homebigadsense2: a.homeBigAdSense2 ?? null,
      homelittleadsense1: a.homeLittleAdSense1 ?? null,
      homelittleadsense2: a.homeLittleAdSense2 ?? null,
    },
  }
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader(_: Route.LoaderArgs) {
  try {
    const data = await fetchFromGraphQL<RootGqlData>(GET_ROOT)
    return {
      tagClouds: data.tagCloud?.tagCloudFields?.tagCloud?.nodes ?? [],
      menuItems: data.menuItems.nodes,
      banners: toBanners(data.bannerek?.bannerFields ?? null),
    }
  } catch (e) {
    console.error('Root loader failed:', e)
    return null
  }
}

// Menu, tag cloud and banners only change on the server side: don't refetch
// them on every client-side navigation.
export function shouldRevalidate() {
  return false
}

// ─── Layout & App ────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Bellefair&family=Noto+Serif:ital@0;1&family=Open+Sans:wght@400;800&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='hu'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
        <script
          async
          src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5865633360595458'
          crossOrigin='anonymous'
        />
      </head>
      <body>
        <ChakraProvider value={system}>{children}</ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const data = useLoaderData<typeof loader>()
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const hasGateBanner = !!data?.banners?.gatebanner?.kep
  const tagClouds = data?.tagClouds ?? []
  const menuItems = data?.menuItems ?? []

  return (
    <>
      {hasGateBanner && data?.banners && <GateBanner banners={data.banners} />}
      <Header
        tagClouds={tagClouds}
        menuItems={menuItems}
        hasGateBanner={hasGateBanner}
        onSearchOpen={() => setSearchOpen(true)}
        onDrawerOpen={() => setDrawerOpen(true)}
      />
      <Box
        as='main'
        position='relative'
        top={hasGateBanner ? { base: '0', md: '250px' } : '0'}
        mb={hasGateBanner ? { base: '0', md: '250px' } : '0'}
        minH='calc(100vh - 320px)'
        maxWidth='1210px'
        mx={{ base: '0', lg: 'auto' }}
        px={{ lg: '0.5rem' }}
        bg='white'
      >
        <Outlet />
      </Box>
      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        menuItems={menuItems}
      />
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Hiba történt'
  let details = 'Váratlan hiba lépett fel.'

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : `${error.status}`
    details =
      error.status === 404
        ? 'Az oldal nem található.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message
  }

  return (
    <Box p='8' textAlign='center'>
      <h1>{message}</h1>
      <p>{details}</p>
    </Box>
  )
}
