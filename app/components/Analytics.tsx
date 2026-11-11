import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

// Google Analytics 4. gtag.js is loaded after hydration (like AdSense), and
// every route change is sent as a page_view once React has rendered the new
// page, so the title is the new one. The initial automatic page_view is off;
// in GA4 the stream's enhanced measurement "page changes based on browser
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
    window.gtag('js', new Date())
    window.gtag('config', measurementId, { send_page_view: false })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)
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
