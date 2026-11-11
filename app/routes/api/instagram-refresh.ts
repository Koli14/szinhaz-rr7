import { createHash, timingSafeEqual } from 'node:crypto'
import { CACHE } from '~/utils/cache'
import { refreshInstagramToken } from '~/utils/instagram.server'

// Weekly Vercel Cron (vercel.json): keeps the Instagram token alive. Vercel
// sends `Authorization: Bearer <CRON_SECRET>`; it can also be started by
// hand on the project's Settings > Cron Jobs page.

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': CACHE.none } })

const digest = (value: string) => createHash('sha256').update(value).digest()

export async function loader({ request }: { request: Request }) {
  const secret = process.env.CRON_SECRET
  const given = request.headers.get('Authorization') ?? ''
  if (!secret || !timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) {
    return json({ ok: false }, 401)
  }
  try {
    const expiresAt = await refreshInstagramToken()
    console.log(`Instagram token refreshed, valid until ${expiresAt}`)
    return json({ ok: true, expiresAt })
  } catch (error) {
    const message = (error as Error).message
    console.error(`Instagram token refresh failed: ${message}`)
    return json({ ok: false, error: message }, 500)
  }
}
