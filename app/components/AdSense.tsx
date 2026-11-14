import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

const ADSENSE_CLIENT = 'ca-pub-5865633360595458'

// Ad units, same slots as the Frontity site
export const AD_SLOTS = {
  postTop1: '7282421936',
  postTop2: '5445334265',
  postTop3: '1874600045',
  postMiddle: '4983842176',
  postEnd1: '9828694222',
  postEnd2: '6375272555',
  postEnd3: '6935355032',
  homeBig1: '7613594428',
  homeBig2: '3315256766',
  homeLittle1: '2696309669',
  homeLittle2: '2664520072',
} as const

// Loads adsbygoogle.js once, after hydration. In the server HTML it inserted
// its own scripts into <head> before React hydrated, and React then threw the
// whole page away and rendered it again on the client.
export function useAdSenseScript() {
  useEffect(() => {
    if (document.querySelector('script[data-adsbygoogle]')) return
    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.dataset.adsbygoogle = ''
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
    document.head.appendChild(script)
  }, [])
}

export function AdSense({
  slot,
  inArticle = false,
}: {
  slot: string
  inArticle?: boolean
}) {
  const ref = useRef<HTMLModElement>(null)
  // A new <ins> for every page. Going from one post to another keeps the
  // route, so React kept the node too: the first post's ad stayed on screen
  // and the next post requested none.
  const { pathname } = useLocation()

  useEffect(() => {
    // Push each <ins> once (effects can run again on remount)
    const el = ref.current
    if (!el || el.dataset.pushed) return
    el.dataset.pushed = 'true'
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
        {},
      )
    } catch {}
  }, [pathname])

  if (inArticle) {
    return (
      <ins
        key={pathname}
        ref={ref}
        className='adsbygoogle'
        style={{ display: 'block', marginTop: '1rem', textAlign: 'center' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-layout='in-article'
        data-ad-format='fluid'
      />
    )
  }

  return (
    <ins
      key={pathname}
      ref={ref}
      className='adsbygoogle'
      style={{ display: 'block', marginTop: '1rem' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format='auto'
      data-full-width-responsive='true'
    />
  )
}
