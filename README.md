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
| `/galeria/`, `/galeria/page/N/`, `/galeria/:slug/` | galleries |
| `/idezet/:slug/` | quotes |
| `/search?s=…&page=N` | search (`/?s=…` and `/hirek/?s=…` redirect here) |
| `/api/instagram` | Instagram posts of the footer, loaded in the browser |
| `/sitemap_index.xml`, `/*-sitemap*.xml`, `/main-sitemap.xsl` | Yoast sitemaps proxied from WordPress |
| `/news-sitemap.xml` | Google News sitemap: the posts of the last 48 hours |
| `/feed/`, `/category/…/feed/`, `/tag/:slug/feed/`, `/folder/:slug/feed/` | RSS feeds proxied from WordPress, with the featured images added |
| `/<key>.txt` | IndexNow key (`public/`, `app/utils/indexnow.server.ts`) |
| `/robots.txt` | generated, see `SITE_INDEXABLE` |

Missing trailing slashes, `/page/1/`, `/kezdooldal/`, `/tags/:slug`,
`/sitemap.xml` and `/wp-sitemap.xml` answer with a 301. Any other URL gets
the 404 page inside the site layout (`routes/not-found.tsx`).

Every page of a list can be opened, however deep. WPGraphQL returns at most
100 items per query, so pages 2, 3, … find their start through the REST API's
`offset` (`app/utils/offset.server.ts`): it gives the id of the item before
the page, and a WPGraphQL cursor is `arrayconnection:<id>`.

## SEO

Every page renders the Yoast head (`seo { fullHead }`) of its WordPress
object: title, description, canonical, Open Graph and JSON-LD. Backend URLs
are rewritten to the frontend origin (`SITE_URL` or the request origin);
uploads stay on WordPress. `app/utils/seo.server.ts` adds what the GraphQL
head lacks or gets wrong:

- the robots meta (`max-image-preview:large` for Google Discover), from
  Yoast's index/follow fields;
- page numbers in the titles, canonicals and prev/next links of `/page/N/`;
- bylines: only the names listed there get out, never a WordPress user name,
  and persons lose their Gravatar.

Titles and descriptions of categories, tags and folders are Yoast templates
(WordPress admin → Yoast SEO → Beállítások). When WordPress invalidates a
changed post (`/api/revalidate`), its URL is also sent to IndexNow.

## Caching

Routes export `headers` with CDN cache rules (`app/utils/cache.ts`). Every
response is tagged with the WordPress content it shows
(`app/utils/cacheTags.server.ts`) and WordPress invalidates those tags when
the content changes (`/api/revalidate`), so the TTLs are only a safety net:

- home, listings, search and galleries: `s-maxage=3600, stale-while-revalidate=86400`
- posts, pages and single galleries: `s-maxage=604800` (7 days),
  `stale-while-revalidate=2592000` (30 days)
- sitemaps 1 h, feed 10 min, 404s 1 min, 5xx never
- permanent redirects: 30 days on the CDN, 1 h in the browser
- client data of prefetched links (`.data`): 5 min in the browser
- hashed assets (`/assets/*`): one year, immutable (`vercel.json`)

## Development

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```
