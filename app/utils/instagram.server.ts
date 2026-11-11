// Instagram feed of the home page ("Színházi pillanatok az Instagramon"),
// ported from the Frontity site (szinhaz.live PR #10). The old PHP proxy at
// insta.szinhaz.online returns nothing since Meta shut down the Basic Display
// API (2024-12-04).
//
// Uses a long-lived Instagram User access token (Instagram API with Instagram
// Login, `instagram_business_basic`). It expires after 60 days and a refresh
// returns a new one, so the weekly cron (/api/instagram-refresh) stores the
// current token in Vercel Global Config (formerly Edge Config).
//
// Environment variables:
//   GLOBAL_CONFIG           store connection string, added when the store is
//                           connected to the project (older stores: EDGE_CONFIG)
//   INSTAGRAM_ACCESS_TOKEN  fallback: the first token, or a re-issued one
//   VERCEL_API_TOKEN        REST API token that may write the store (cron)
//   VERCEL_TEAM_ID          team owning the store (cron)
//   CRON_SECRET             Vercel Cron sends it as a Bearer token

import type { InstaPost } from '~/components/Instagram'

const TOKEN_KEY = 'instagramAccessToken'
const EXPIRES_KEY = 'instagramTokenExpiresAt'
const MEDIA_URL = 'https://graph.instagram.com/me/media'
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token'
const FIELDS = 'id,media_type,media_url,thumbnail_url,permalink'
const LIMIT = 8
const TIMEOUT_MS = 5000
// The home page waits for the feed: give up on it rather than be slow
const FEED_TIMEOUT_MS = 2000

function getConnection() {
  const raw = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG
  if (!raw) return null
  const url = new URL(raw)
  return {
    origin: url.origin,
    id: url.pathname.replace(/^\/+|\/+$/g, ''),
    token: url.searchParams.get('token'),
  }
}

async function readStoredToken(): Promise<string | null> {
  const connection = getConnection()
  if (!connection) return null
  const response = await fetch(
    `${connection.origin}/${connection.id}/item/${TOKEN_KEY}`,
    {
      headers: { Authorization: `Bearer ${connection.token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  )
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Global Config read failed: HTTP ${response.status}`)
  }
  return response.json()
}

// Best first: the stored token (kept fresh by the cron), then the env one.
// A broken store must not take the feed down with it.
async function getTokenCandidates() {
  let stored: string | null = null
  try {
    stored = await readStoredToken()
  } catch (error) {
    console.error((error as Error).message)
  }
  return [
    ...new Set(
      [stored, process.env.INSTAGRAM_ACCESS_TOKEN].filter(
        (token): token is string => typeof token === 'string' && !!token,
      ),
    ),
  ]
}

// Tries the tokens in order; only a rejected token moves on to the next one
async function withToken<T>(fn: (token: string) => Promise<T>) {
  const tokens = await getTokenCandidates()
  if (!tokens.length) throw new Error('No Instagram access token configured')
  let lastError: unknown
  for (const token of tokens) {
    try {
      return await fn(token)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function getJson(url: URL) {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(body.error?.message || `HTTP ${response.status}`)
  }
  return body
}

type Media = {
  id: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
}

const timeout = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms),
  )

// Never breaks the home page: no token or an Instagram error is an empty feed
export async function loadInstagram(): Promise<InstaPost[]> {
  try {
    return await Promise.race([fetchFeed(), timeout(FEED_TIMEOUT_MS)])
  } catch (error) {
    if (process.env.INSTAGRAM_ACCESS_TOKEN || getConnection()) {
      console.error(`Instagram feed failed: ${(error as Error).message}`)
    }
    return []
  }
}

function fetchFeed(): Promise<InstaPost[]> {
  return withToken(async (token) => {
    const url = new URL(MEDIA_URL)
    url.search = new URLSearchParams({
      fields: FIELDS,
      limit: String(LIMIT),
      access_token: token,
    }).toString()
    const body = (await getJson(url)) as { data?: Media[] }
    // Videos have an mp4 in media_url: show their cover image instead.
    // Copyright-muted videos come without media.
    return (body.data ?? [])
      .map((item) => ({
        id: item.id,
        url: item.permalink ?? '',
        thumbnail:
          (item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url) ??
          '',
      }))
      .filter((post) => post.url && post.thumbnail)
  })
}

async function saveToken(token: string, expiresAt: string) {
  const connection = getConnection()
  if (!connection) throw new Error('GLOBAL_CONFIG is not set')
  const apiToken = process.env.VERCEL_API_TOKEN
  if (!apiToken) throw new Error('VERCEL_API_TOKEN is not set')

  const url = new URL(
    `https://api.vercel.com/v1/global-config/${connection.id}/items`,
  )
  if (process.env.VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID)
  }
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        { operation: 'upsert', key: TOKEN_KEY, value: token },
        { operation: 'upsert', key: EXPIRES_KEY, value: expiresAt },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(
      `Global Config write failed: ${body.error?.message || `HTTP ${response.status}`}`,
    )
  }
}

// Extends the token by another 60 days (fails for tokens younger than 24
// hours or already expired) and stores the new one
export async function refreshInstagramToken() {
  const refreshed = (await withToken((token) => {
    const url = new URL(REFRESH_URL)
    url.search = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: token,
    }).toString()
    return getJson(url)
  })) as { access_token?: string; expires_in: number }
  if (!refreshed.access_token) throw new Error('No token in the response')

  const expiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString()
  await saveToken(refreshed.access_token, expiresAt)
  return expiresAt
}
