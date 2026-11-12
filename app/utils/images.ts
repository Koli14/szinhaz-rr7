// Responsive images through Jetpack's image CDN (Photon, i0.wp.com), which
// serves all WordPress images on prod. Two things make them much lighter:
// - `w=` widths, so phones don't download the 800–1920 px original
// - `quality=80`: without it Photon turns PNGs into lossless WebP, e.g. a
//   452 KB lead image, 58 KB with it (23 KB at 480 px)
// Other URLs (and GIFs, which may be animated banners) are left alone.

const PHOTON = /^https:\/\/i[0-3]\.wp\.com\//
const QUALITY = '80'

const isPhoton = (url: string) => PHOTON.test(url) && !/\.gif(\?|$)/i.test(url)

export function photonUrl(url: string, width: number) {
  if (!isPhoton(url)) return url
  const u = new URL(url)
  u.search = ''
  u.searchParams.set('w', String(width))
  u.searchParams.set('quality', QUALITY)
  u.searchParams.set('ssl', '1')
  return u.toString()
}

// `{ src, srcSet }` for an <img>/<source>; src is the widest variant
export function responsiveImage(url: string, widths: number[]) {
  if (!isPhoton(url)) return { src: url, srcSet: undefined }
  return {
    src: photonUrl(url, widths[widths.length - 1]),
    srcSet: widths.map((w) => `${photonUrl(url, w)} ${w}w`).join(', '),
  }
}

// Post images are at most 800 px wide on this site
export const POST_IMAGE_WIDTHS = [360, 480, 640, 800]
export const BANNER_WIDTHS = [480, 800, 1200]
export const GATE_BANNER_WIDTHS = [1280, 1920]
export const GATE_BANNER_MOBILE_WIDTHS = [480, 800]

// Chakra's `md` breakpoint (48rem): the desktop gate banner starts here
export const DESKTOP_MEDIA = '(min-width: 48rem)'
