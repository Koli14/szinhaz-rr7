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
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void }
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

// Opens Google's consent message again, so visitors can change their choice
export function openConsentSettings() {
  window.googlefc = window.googlefc ?? {}
  window.googlefc.callbackQueue = window.googlefc.callbackQueue ?? []
  window.googlefc.callbackQueue.push(() =>
    window.googlefc?.showRevocationMessage?.(),
  )
}
