import { type RouteConfig, index, route } from '@react-router/dev/routes'

// Yoast splits sitemaps into files of 1000 URLs: post-sitemap.xml,
// post-sitemap2.xml, … React Router has no partial dynamic segments, so the
// possible file names are listed up front (prod has ~32k posts, ~9k tags).
const SITEMAP_PAGES: Record<string, number> = {
  post: 80,
  post_tag: 30,
  page: 3,
  category: 3,
  folder: 3,
  galeria: 3,
  idezet: 3,
}

const sitemapRoutes = Object.entries(SITEMAP_PAGES).flatMap(([type, count]) =>
  Array.from({ length: count }, (_, i) => {
    const file = `${type}-sitemap${i === 0 ? '' : i + 1}.xml`
    return route(file, 'routes/sitemap.ts', { id: `sitemap-${file}` })
  }),
)

export default [
  index('routes/home.tsx'),

  // SEO and feeds
  route('robots.txt', 'routes/robots.ts'),
  route('sitemap_index.xml', 'routes/sitemap.ts', { id: 'sitemap-index' }),
  route('main-sitemap.xsl', 'routes/sitemap.ts', { id: 'sitemap-xsl' }),
  route('sitemap.xml', 'routes/sitemap.ts', { id: 'sitemap-legacy' }),
  route('wp-sitemap.xml', 'routes/sitemap.ts', { id: 'sitemap-wp' }),
  ...sitemapRoutes,
  route('feed', 'routes/feed.ts'),

  // CDN cache invalidation, called by WordPress
  route('api/revalidate', 'routes/api/revalidate.ts'),
  // Weekly cron: keeps the Instagram access token alive
  route('api/instagram-refresh', 'routes/api/instagram-refresh.ts'),

  // Listings, with WordPress-style /page/N/ pagination
  route('hirek/*', 'routes/archive.tsx', { id: 'archive-posts' }),
  route('category/*', 'routes/archive.tsx', { id: 'archive-category' }),
  route('tag/*', 'routes/archive.tsx', { id: 'archive-tag' }),
  route('folder/*', 'routes/archive.tsx', { id: 'archive-folder' }),
  route('search', 'routes/search.tsx'),
  route('galeria', 'routes/gallery.tsx'),
  route('galeria/:gallerySlug', 'routes/gallery-single.tsx'),

  // Aliases
  route('kezdooldal', 'routes/redirect.ts', { id: 'redirect-front-page' }),
  route('tags/:slug', 'routes/redirect.ts', { id: 'redirect-tags' }),
  route('wp-content/*', 'routes/redirect.ts', { id: 'redirect-wp-content' }),
  // WordPress paged post URLs (/post-slug/2/), linked from outside
  route(':slug/:page', 'routes/redirect.ts', { id: 'redirect-post-page' }),

  // Single posts, pages and quotes, resolved by their WordPress URI
  route('idezet/:slug', 'routes/node.tsx', { id: 'node-quote' }),
  route(':slug', 'routes/node.tsx', { id: 'node' }),
] satisfies RouteConfig
