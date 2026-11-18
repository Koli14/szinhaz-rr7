import { CACHE } from '~/utils/cache'
import { loadInstagram } from '~/utils/instagram.server'

// The latest Instagram posts for the footer of every page but the home page
// (which has them in its own data). Fetched in the browser: post pages stay
// in the CDN for days, and Instagram's image URLs expire sooner than that.
export async function loader() {
  const posts = await loadInstagram()
  return Response.json(posts, {
    headers: { 'Cache-Control': posts.length ? CACHE.list : CACHE.error },
  })
}
