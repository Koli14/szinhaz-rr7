import { Box } from '@chakra-ui/react'
import { Carousel } from '~/components/Carousel'

type Slide = { img: string; caption: string }
type Gallery = { className: string; slides: Slide[]; after: string }
type Segment = { html: string } | { gallery: Gallery }

// Pre-WP 5.9 gallery blocks: <figure class="wp-block-gallery …"><ul
// class="blocks-gallery-grid"><li>…</li></ul>[<figcaption>]</figure>. The
// Frontity theme turned their list into a carousel, newer galleries stay HTML.
const GALLERY =
  /<figure\b([^>]*)>\s*<ul class="blocks-gallery-grid">([\s\S]*?)<\/ul>([\s\S]*?)<\/figure>/g
const ITEM = /<li\b[^>]*>([\s\S]*?)<\/li>/g
const IMG = /<img\b[^>]*>/
const CAPTION = /<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/
const CLASS = /\bclass="([^"]*)"/

function splitGalleries(html: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  for (const m of html.matchAll(GALLERY)) {
    const slides = [...m[2].matchAll(ITEM)].flatMap(([, item]) => {
      const img = item.match(IMG)?.[0]
      return img ? [{ img, caption: item.match(CAPTION)?.[1] ?? '' }] : []
    })
    if (!slides.length) continue
    segments.push({ html: html.slice(last, m.index) })
    segments.push({
      gallery: {
        className: m[1].match(CLASS)?.[1] ?? '',
        slides,
        after: m[3],
      },
    })
    last = m.index + m[0].length
  }
  segments.push({ html: html.slice(last) })
  return segments.filter((s) => !('html' in s) || s.html.trim())
}

// The same layout as the Frontity gallery processor: side padding for the
// arrows, white arrows on mobile, the caption under each image.
function PostGallery({ className, slides, after }: Gallery) {
  return (
    <figure className={className}>
      <Box
        className='postGallery'
        position='relative'
        textAlign='center'
        px='55px'
        fontFamily='sans-serif'
      >
        <Carousel
          label='Galéria'
          arrowColor={{ base: 'white', md: '#9D9D9D' }}
          arrowInset='-47px'
        >
          {slides.map((slide, i) => (
            <Box key={i}>
              <span dangerouslySetInnerHTML={{ __html: slide.img }} />
              <Box
                mt='20px'
                mb='40px'
                opacity='0.8'
                dangerouslySetInnerHTML={{ __html: slide.caption }}
              />
            </Box>
          ))}
        </Carousel>
      </Box>
      {after.trim() && <div dangerouslySetInnerHTML={{ __html: after }} />}
    </figure>
  )
}

// A chunk of the post HTML. Each HTML run is wrapped in `.postBlocks`, so
// post.css can tell top-level paragraphs from nested ones.
export function PostContent({ html }: { html: string }) {
  return splitGalleries(html).map((segment, i) =>
    'html' in segment ? (
      <div
        key={i}
        className='postBlocks'
        dangerouslySetInnerHTML={{ __html: segment.html }}
      />
    ) : (
      <PostGallery key={i} {...segment.gallery} />
    ),
  )
}
