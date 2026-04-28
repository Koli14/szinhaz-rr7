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
import type { Route } from "./+types/root"
import { system } from "./utils/theme"
import "./app.css"
import { Header } from "./components/header"
import { GateBanner } from "./components/GateBanner"
import { fetchFromGraphQL, gql } from "./utils/graphql.server"
import type { RootData } from "./types"

const GET_ROOT = gql`
  query getRoot {
    tagCloud {
      tagCloud {
        tagCloud {
          name
          slug
          taxonomyName
          taxonomyColor {
            taxColor
          }
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
    bannerek {
      bannerek {
        gatebanner {
          kep {
            sourceUrl
          }
          link {
            url
          }
        }
        gatebannermobile {
          kep {
            sourceUrl
          }
        }
      }
    }
  }
`

export async function loader(_: Route.LoaderArgs) {
  try {
    return await fetchFromGraphQL<RootData>(GET_ROOT)
  } catch (e) {
    console.error("Root loader failed:", e)
    return null
  }
}

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
  const hasGateBanner = !!data?.bannerek?.bannerek?.gatebanner?.kep
  const tagClouds = data?.tagCloud?.tagCloud?.tagCloud ?? []
  const menuItems = data?.menuItems?.nodes ?? []
  const banners = data?.bannerek?.bannerek

  return (
    <>
      {hasGateBanner && banners && <GateBanner banners={banners} />}
      <Header
        tagClouds={tagClouds}
        menuItems={menuItems}
        hasGateBanner={hasGateBanner}
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
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Hiba történt"
  let details = "Váratlan hiba lépett fel."

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : `${error.status}`
    details = error.status === 404
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
