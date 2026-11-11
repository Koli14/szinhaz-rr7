import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

type TcData = {
  eventStatus?: string
  gdprApplies?: boolean
  purpose?: { consents?: Record<string, boolean> }
  vendor?: { consents?: Record<string, boolean> }
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: TcData, success: boolean) => void,
    ) => void
  }
}

// EEA, UK and Switzerland: Google's consent message (AdSense Privacy &
// messaging, a TCF CMP loaded by adsbygoogle.js) asks there, so Google tags
// wait for consent. Elsewhere there is no message and no consent needed.
const CONSENT_REGIONS = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'IS',
  'LI',
  'NO',
  'GB',
  'CH',
]
const CONSENT_TYPES = [
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'analytics_storage',
] as const
const GOOGLE_VENDOR_ID = '755'

const allConsent = (value: 'granted' | 'denied') =>
  Object.fromEntries(CONSENT_TYPES.map((type) => [type, value]))

// TCF choices → Google consent mode (Google's own mapping: purpose 1 is
// storage, 3–4 personalised ads, 7 ad measurement)
function toConsentMode(tc: TcData) {
  if (tc.gdprApplies === false) return allConsent('granted')
  const p = tc.purpose?.consents ?? {}
  const google = !!tc.vendor?.consents?.[GOOGLE_VENDOR_ID]
  const state = (ok: boolean) => (ok && google ? 'granted' : 'denied')
  return {
    ad_storage: state(!!p[1]),
    ad_user_data: state(!!p[1] && !!p[7]),
    ad_personalization: state(!!p[3] && !!p[4]),
    analytics_storage: state(!!p[1]),
  }
}

// The CMP arrives with adsbygoogle.js, some time after hydration
function onTcfConsent(callback: (tc: TcData) => void) {
  let tries = 0
  const timer = setInterval(() => {
    if (window.__tcfapi) {
      clearInterval(timer)
      window.__tcfapi('addEventListener', 2, (tc, success) => {
        if (!success) return
        if (
          tc.eventStatus === 'tcloaded' ||
          tc.eventStatus === 'useractioncomplete'
        ) {
          callback(tc)
        }
      })
    } else if (++tries > 60) {
      clearInterval(timer)
    }
  }, 250)
  return () => clearInterval(timer)
}

// Google Analytics 4 with consent mode v2. gtag.js is loaded after hydration
// (like AdSense), and every route change is sent as a page_view once React
// has rendered the new page, so the title is the new one. Without consent GA
// only sends cookieless pings. The initial automatic page_view is off; in
// GA4 the stream's enhanced measurement "page changes based on browser
// history events" must be off too, otherwise navigations count twice.
export function useGoogleAnalytics(measurementId: string | null | undefined) {
  const location = useLocation()
  const previousUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!measurementId || window.gtag) return
    window.dataLayer = window.dataLayer ?? []
    window.gtag = function gtag() {
      // gtag.js expects the arguments object itself
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('consent', 'default', {
      ...allConsent('denied'),
      region: CONSENT_REGIONS,
      wait_for_update: 500,
    })
    window.gtag('consent', 'default', allConsent('granted'))
    window.gtag('js', new Date())
    window.gtag('config', measurementId, { send_page_view: false })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    return onTcfConsent((tc) =>
      window.gtag?.('consent', 'update', toConsentMode(tc)),
    )
  }, [measurementId])

  useEffect(() => {
    if (!measurementId || !window.gtag) return
    const url = window.location.href
    if (url === previousUrl.current) return
    window.gtag('event', 'page_view', {
      page_location: url,
      page_title: document.title,
      page_referrer: previousUrl.current ?? document.referrer,
    })
    previousUrl.current = url
  }, [measurementId, location.pathname, location.search])
}

// Google's consent message (CMP) adds a floating "privacy and cookie
// settings" button in the bottom left corner, over the left side of the gate
// banner. It lives in an open shadow root and Google keeps resetting its
// class and inline position, so a stylesheet with !important moves it (and
// its bubble) to the right instead. If Google changes the markup, the rules
// stop matching and the button stays on the left; nothing breaks.
// (The position may also be configurable in AdSense > Privacy & messaging.)
const TOOLBAR = '#ft-floating-toolbar'
const RIGHT_CSS = [
  `${TOOLBAR}{left:auto!important;right:10px!important}`,
  `${TOOLBAR} .ft-menu{left:auto!important;right:0!important}`,
  `${TOOLBAR} .ft-reg-bubble{left:auto!important;right:65px!important}`,
].join('')

export function useConsentButtonOnRight() {
  useEffect(() => {
    const apply = () => {
      for (const el of document.body.children) {
        const root = el.shadowRoot
        if (!root?.querySelector(TOOLBAR)) continue
        if (root.querySelector('style[data-szinhaz-right]')) continue
        const style = document.createElement('style')
        style.dataset.szinhazRight = ''
        style.textContent = RIGHT_CSS
        root.appendChild(style)
      }
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true })
    // The CMP fills its shadow root a moment after adding the host element
    const timer = setInterval(apply, 1000)
    const stop = setTimeout(() => clearInterval(timer), 30_000)
    return () => {
      observer.disconnect()
      clearInterval(timer)
      clearTimeout(stop)
    }
  }, [])
}
