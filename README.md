# Színház.online (React Router 7)

Headless frontend for [szinhaz.online](https://szinhaz.online), replacing the
Frontity site. Data comes from WordPress through WPGraphQL.

## Stack

- React Router 7 (framework mode, SSR) + Vite, React 19, Chakra UI v3
- WordPress backend plugins: WPGraphQL, WPGraphQL for ACF (3.x), Yoast SEO,
  Add WPGraphQL SEO, ACF PRO, Custom Post Type UI
- Deployed on Vercel with `@vercel/react-router` (Fluid compute, `fra1`)

## URLs

The site keeps the WordPress/Frontity URL structure:

| URL | Route |
| --- | --- |
| `/` | home (`cimlap` folder) |
| `/:slug/` | post or page, resolved with `nodeByUri` |
| `/category/…/`, `/tag/:slug/`, `/folder/:slug/`, `/hirek/` | archives, with `/page/N/` pagination |
| `/galeria/`, `/galeria/:slug/` | galleries |
| `/idezet/:slug/` | quotes |
| `/search?s=…` | search (`/?s=…` redirects here) |
| `/sitemap_index.xml`, `/*-sitemap*.xml`, `/main-sitemap.xsl` | Yoast sitemaps proxied from WordPress |
| `/feed/` | RSS feed proxied from WordPress |
| `/robots.txt` | generated, see `SITE_INDEXABLE` |

Missing trailing slashes, `/page/1/`, `/kezdooldal/`, `/tags/:slug`,
`/sitemap.xml` and `/wp-sitemap.xml` answer with a 301.

## SEO

Every page renders the Yoast head (`seo { fullHead }`) of its WordPress
object: title, description, canonical, Open Graph and JSON-LD. Backend URLs
are rewritten to the frontend origin (`SITE_URL` or the request origin);
uploads stay on WordPress.

## Caching

Routes export `headers` with CDN cache rules (`app/utils/cache.ts`), the same
as the Frontity site:

- home and listings: `s-maxage=60, stale-while-revalidate=86400`
- posts and pages: `s-maxage=3600, stale-while-revalidate=86400`
- sitemaps 1 h, feed 10 min, 404s 1 min, 5xx never
- hashed assets (`/assets/*`): one year, immutable (`vercel.json`)

## Development

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```
