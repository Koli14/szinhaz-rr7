#!/usr/bin/env node
// URL parity check for the cutover rehearsal.
//
// Builds a URL list from a WordPress backend (REST API, read-only) and checks
// each URL on the rr7 frontend: status, <title>, canonical. With --ref it also
// compares the <title> with the old frontend (Frontity on szinhaz.online).
//
//   node scripts/url-parity.mjs \
//     --wp https://remix.szinhaz.online \
//     --base https://szinhaz-rr7.vercel.app \
//     --ref https://szinhaz.online \
//     --posts 300 --tags 150 --out parity.json
//
// --urls file.txt  checks the paths in the file instead of sampling WordPress.

import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
  options: {
    wp: { type: 'string' },
    base: { type: 'string' },
    ref: { type: 'string' },
    urls: { type: 'string' },
    posts: { type: 'string', default: '300' },
    tags: { type: 'string', default: '150' },
    concurrency: { type: 'string', default: '4' },
    out: { type: 'string', default: 'parity.json' },
  },
})

if (!args.base || (!args.wp && !args.urls)) {
  console.error('usage: --base <frontend> (--wp <wordpress> | --urls <file>)')
  process.exit(1)
}

const BASE = args.base.replace(/\/$/, '')
const REF = args.ref?.replace(/\/$/, '')
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

const FIXED = [
  '/',
  '/hirek/',
  '/hirek/page/2/',
  '/galeria/',
  '/feed/',
  '/robots.txt',
  '/sitemap_index.xml',
  '/post-sitemap.xml',
  '/category-sitemap.xml',
]

async function getJson(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA },
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return {
    data: await res.json(),
    total: Number(res.headers.get('x-wp-total')),
  }
}

const toPath = (link) => new URL(link).pathname

// Every item of a small type, or `count` random items of a big one.
// Random REST pages keep the load on the backend small.
async function sample(wp, type, count, extra = '') {
  const endpoint = `${wp}/wp-json/wp/v2/${type}?_fields=link${extra}`
  const first = await getJson(`${endpoint}&per_page=100`)
  const paths = first.data.map((item) => toPath(item.link))
  if (count === Infinity || first.total <= 100) {
    const pages = Math.ceil(first.total / 100)
    for (let page = 2; page <= pages; page++) {
      const { data } = await getJson(`${endpoint}&per_page=100&page=${page}`)
      paths.push(...data.map((item) => toPath(item.link)))
    }
    return paths
  }
  const picked = new Set(paths.slice(0, 50)) // newest 50
  const perPage = 20
  const pages = Math.ceil(first.total / perPage)
  while (picked.size < Math.min(count, first.total)) {
    const page = 1 + Math.floor(Math.random() * pages)
    const { data } = await getJson(
      `${endpoint}&per_page=${perPage}&page=${page}`,
    )
    for (const item of data.slice(0, 3)) picked.add(toPath(item.link))
  }
  return [...picked].slice(0, count)
}

async function buildList() {
  if (args.urls) {
    const text = await readFile(args.urls, 'utf8')
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }
  const wp = args.wp.replace(/\/$/, '')
  const groups = await Promise.all([
    sample(wp, 'pages', Infinity),
    sample(wp, 'categories', Infinity, '&hide_empty=true'),
    sample(wp, 'galeria', Infinity),
    sample(wp, 'idezet', Infinity),
    sample(wp, 'posts', Number(args.posts)),
    sample(wp, 'tags', Number(args.tags), '&hide_empty=true'),
  ])
  return [...new Set([...FIXED, ...groups.flat()])]
}

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const titleOf = (html) => {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return m ? decode(m[1]) : null
}

const canonicalOf = (html) => {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (/rel=["']canonical["']/i.test(tag)) {
      return tag.match(/href=["']([^"']+)["']/i)?.[1] ?? null
    }
  }
  return null
}

async function check(path) {
  const started = Date.now()
  const result = { path }
  try {
    const res = await fetch(BASE + path, {
      redirect: 'manual',
      headers: { 'user-agent': UA },
      signal: AbortSignal.timeout(30_000),
    })
    result.status = res.status
    result.ms = Date.now() - started
    result.cache = res.headers.get('x-vercel-cache')
    if (res.status >= 300 && res.status < 400) {
      result.location = res.headers.get('location')
    }
    const type = res.headers.get('content-type') ?? ''
    if (res.status === 200 && type.includes('html')) {
      const html = await res.text()
      result.title = titleOf(html)
      const canonical = canonicalOf(html)
      result.canonical = canonical && new URL(canonical, BASE).pathname
    }
  } catch (error) {
    result.error = String(error.message ?? error)
  }

  if (REF && result.title !== undefined) {
    try {
      const res = await fetch(REF + path, {
        headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(30_000),
      })
      result.refStatus = res.status
      if (res.ok) result.refTitle = titleOf(await res.text())
    } catch (error) {
      result.refError = String(error.message ?? error)
    }
  }

  result.problems = problemsOf(result)
  return result
}

function problemsOf(r) {
  const problems = []
  if (r.error) problems.push(`error: ${r.error}`)
  else if (r.status !== 200) problems.push(`status ${r.status}`)
  if (r.title === null) problems.push('no <title>')
  if (r.title !== undefined && r.canonical !== r.path) {
    problems.push(`canonical ${r.canonical}`)
  }
  if (r.refTitle && r.title && r.refTitle !== r.title) {
    problems.push('title differs from ref')
  }
  return problems
}

async function run(list) {
  const results = []
  let next = 0
  let done = 0
  const worker = async () => {
    while (next < list.length) {
      const path = list[next++]
      const result = await check(path)
      results.push(result)
      done++
      if (result.problems.length) {
        console.log(`✗ ${path} — ${result.problems.join('; ')}`)
      }
      if (done % 50 === 0) console.log(`… ${done}/${list.length}`)
    }
  }
  await Promise.all(Array.from({ length: Number(args.concurrency) }, worker))
  return results
}

const list = await buildList()
console.log(`${list.length} URLs → ${BASE}${REF ? ` (ref ${REF})` : ''}`)
const results = await run(list)

const bad = results.filter((r) => r.problems.length)
const times = results
  .filter((r) => r.ms)
  .map((r) => r.ms)
  .sort((a, b) => a - b)
const pct = (p) => times[Math.floor((times.length - 1) * p)]
console.log(
  `\n${results.length - bad.length}/${results.length} OK, ${bad.length} with problems; ` +
    `ms p50 ${pct(0.5)}, p90 ${pct(0.9)}, max ${times.at(-1)}`,
)
await writeFile(
  args.out,
  JSON.stringify({ base: BASE, ref: REF, results }, null, 2),
)
console.log(`details: ${args.out}`)
process.exitCode = bad.length ? 1 : 0
