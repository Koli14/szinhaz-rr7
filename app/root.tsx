import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router"
import { ChakraProvider, Box } from "@chakra-ui/react"
import { useState } from "react"
import type { Route } from "./+types/root"
import { system } from "./utils/theme"
import "./app.css"
import { Header } from "./components/header"
import { GateBanner } from "./components/GateBanner"
import { SearchModal } from "./components/search/SearchModal"
import { MobileDrawer } from "./components/header/MobileDrawer"
import { fetchFromGraphQL, gql } from "./utils/graphql.server"
import type { Tag, FlatMenuItem, BannersData, BannerSlot } from "./types"

// ─── GraphQL (menu items + tags by slug) ────────────────────────────────────

type RootGqlData = {
  tags: { nodes: Tag[] }
  menuItems: { nodes: FlatMenuItem[] }
}

const GET_ROOT = gql`
  query getRoot($slugs: [String]) {
    tags(where: { slug: $slugs }) {
      nodes {
        name
        slug
        taxonomyColor {
          taxColor
        }
      }
    }
    menuItems(first: 100, where: { location: PRIMARY }) {
      nodes {
        key: id
        parentId
        title: label
        uri
      }
    }
  }
`

// ─── REST helpers ────────────────────────────────────────────────────────────

type RestKep = false | { url: string }
type RestBannerSlot = { kep: RestKep; link: string }
type RestBannersAcf = {
  adsense: {
    homeBigAdSense1: boolean
    homeBigAdSense2: boolean
    homeLittleAdSense1: boolean
    homeLittleAdSense2: boolean
    postBigAdSense1: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    postBigAdSense1_2: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    postBigAdSense1_3: boolean
    postBigAdSense2: boolean
    postLittleAdSense1: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    postLittleAdSense1_2: boolean
    // eslint-disable-next-line @typescript-eslint/naming-convention
    postLittleAdSense1_3: boolean
  }
  gateBanner: RestBannerSlot
  gateBannerMobile: { kep: RestKep }
  bigBanner1: RestBannerSlot
  bigBanner2: RestBannerSlot
  bigBanner3: RestBannerSlot
  bigBanner4: RestBannerSlot
  littleBanner1: RestBannerSlot
  littleBanner2: RestBannerSlot
}

function kepToSlot(kep: RestKep): { sourceUrl: string } | null {
  if (!kep || typeof kep !== "object") return null
  return { sourceUrl: kep.url }
}

function restToSlot(slot: RestBannerSlot | undefined): BannerSlot | null {
  if (!slot) return null
  const kep = kepToSlot(slot.kep)
  if (!kep) return null
  return { kep, link: slot.link ? { url: slot.link } : null }
}

async function fetchTagCloudSlugs(wpBase: string): Promise<string[]> {
  try {
    const res = await fetch(`${wpBase}/wp-json/acf/v3/options/options`)
    if (!res.ok) return []
    const data = await res.json() as { acf: { tag_cloud?: Array<{ slug: string }> } }
    return data?.acf?.tag_cloud?.map((t) => t.slug) ?? []
  } catch {
    return []
  }
}

async function fetchBanners(wpBase: string): Promise<BannersData | null> {
  try {
    const res = await fetch(`${wpBase}/wp-json/acf/v3/options/banners`)
    if (!res.ok) return null
    const data = await res.json() as { acf?: RestBannersAcf }
    const acf = data?.acf
    if (!acf) return null
    return {
      gatebanner: restToSlot(acf.gateBanner),
      gatebannermobile: { kep: kepToSlot(acf.gateBannerMobile?.kep) },
      bigbanner1: restToSlot(acf.bigBanner1),
      bigbanner2: restToSlot(acf.bigBanner2),
      bigbanner3: restToSlot(acf.bigBanner3),
      bigbanner4: restToSlot(acf.bigBanner4),
      littlebanner1: restToSlot(acf.littleBanner1),
      littlebanner2: restToSlot(acf.littleBanner2),
      adsense: {
        postbigadsense1: acf.adsense?.postBigAdSense1 ?? null,
        postbigadsense1_2: acf.adsense?.postBigAdSense1_2 ?? null,
        postbigadsense1_3: acf.adsense?.postBigAdSense1_3 ?? null,
        postbigadsense2: acf.adsense?.postBigAdSense2 ?? null,
        postlittleadsense1: acf.adsense?.postLittleAdSense1 ?? null,
        postlittleadsense1_2: acf.adsense?.postLittleAdSense1_2 ?? null,
        postlittleadsense1_3: acf.adsense?.postLittleAdSense1_3 ?? null,
        homebigadsense1: acf.adsense?.homeBigAdSense1 ?? null,
        homebigadsense2: acf.adsense?.homeBigAdSense2 ?? null,
        homelittleadsense1: acf.adsense?.homeLittleAdSense1 ?? null,
        homelittleadsense2: acf.adsense?.homeLittleAdSense2 ?? null,
      },
    }
  } catch {
    return null
  }
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loader(_: Route.LoaderArgs) {
  try {
    const wpBase = (process.env.GRAPHQL_API ?? "").replace("/graphql", "")

    const [tagSlugs, banners] = await Promise.all([
      fetchTagCloudSlugs(wpBase),
      fetchBanners(wpBase),
    ])

    const data = await fetchFromGraphQL<RootGqlData>(GET_ROOT, {
      slugs: tagSlugs.length ? tagSlugs : null,
    })

    const bySlug = new Map(data.tags.nodes.map((t) => [t.slug, t]))
    const tagClouds = tagSlugs.length
      ? (tagSlugs.map((s) => bySlug.get(s)).filter(Boolean) as Tag[])
      : data.tags.nodes

    return { tagClouds, menuItems: data.menuItems.nodes, banners }
  } catch (e) {
    console.error("Root loader failed:", e)
    return null
  }
}

// ─── Layout & App ────────────────────────────────────────────────────────────

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Bellefair&family=Noto+Serif:ital@0;1&family=Open+Sans:wght@400;800&display=swap",
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5865633360595458"
          crossOrigin="anonymous"
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
        as="main"
        position="relative"
        top={hasGateBanner ? { base: "0", md: "250px" } : "0"}
        mb={hasGateBanner ? { base: "0", md: "250px" } : "0"}
        minH="calc(100vh - 320px)"
        maxWidth="1210px"
        mx={{ base: "0", lg: "auto" }}
        px={{ lg: "0.5rem" }}
        bg="white"
      >
        <Outlet />
      </Box>
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
  let message = "Hiba történt"
  let details = "Váratlan hiba lépett fel."

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : `${error.status}`
    details =
      error.status === 404
        ? "Az oldal nem található."
        : error.statusText || details
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message
  }

  return (
    <Box p="8" textAlign="center">
      <h1>{message}</h1>
      <p>{details}</p>
    </Box>
  )
}
