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
  route('news-sitemap.xml', 'routes/news-sitemap.ts'),
  route('feed', 'routes/feed.ts'),
  // Feeds of categories (up to three levels), tags and folders. They rank
  // above the listing splats below.
  route('category/:a/feed', 'routes/feed.ts', { id: 'feed-category-1' }),
  route('category/:a/:b/feed', 'routes/feed.ts', { id: 'feed-category-2' }),
  route('category/:a/:b/:c/feed', 'routes/feed.ts', { id: 'feed-category-3' }),
  route('tag/:slug/feed', 'routes/feed.ts', { id: 'feed-tag' }),
  route('folder/:slug/feed', 'routes/feed.ts', { id: 'feed-folder' }),

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
