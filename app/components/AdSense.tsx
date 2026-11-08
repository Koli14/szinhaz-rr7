import { useEffect } from 'react'

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
} as const

export function AdSense({
  slot,
  inArticle = false,
}: {
  slot: string
  inArticle?: boolean
}) {
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
        {},
      )
    } catch {}
  }, [])

  if (inArticle) {
    return (
      <ins
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
      className='adsbygoogle'
      style={{ display: 'block', marginTop: '1rem' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format='auto'
      data-full-width-responsive='true'
    />
  )
}
