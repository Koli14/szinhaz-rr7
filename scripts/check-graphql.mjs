#!/usr/bin/env node
// Read-only smoke test of a WordPress GraphQL backend before rr7 is pointed
// at it (phase A of ops/wp-upgrade): runs only queries, never mutations.
//
//   node scripts/check-graphql.mjs https://wp.szinhaz.online/graphql
//
// Checks what rr7 needs and a URL-level parity test can't see: menu, banners,
// tag cloud and colours, home folders, quotes, galleries, related posts,
// Yoast head, MENU_ORDER sorting, WPGraphQL Smart Cache keys and whether
// content images go through Jetpack's image CDN (i0.wp.com).

const endpoint = process.argv[2]
if (!endpoint) {
  console.error('usage: node scripts/check-graphql.mjs <graphql endpoint>')
  process.exit(2)
}

const UA = 'szinhaz-rr7 check-graphql'
let failures = 0

async function query(q, variables) {
  const started = Date.now()
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ query: q, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return {
    data: json.data,
    keys: res.headers.get('x-graphql-keys') ?? '',
    ms: Date.now() - started,
  }
}

function check(name, ok, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`)
}

async function run(name, fn) {
  try {
    await fn()
  } catch (error) {
    check(name, false, error.message)
  }
}

const SLOT = 'kep { node { sourceUrl } } link { url }'

await run('root', async () => {
  const { data, keys, ms } = await query(`{
    menuItems(first: 100, where: { location: PRIMARY }) { nodes { id label uri parentId } }
    tagCloud { tagCloudFields { tagCloud { nodes { name ... on Tag { taxonomyColor { taxColor } } } } } }
    bannerek { bannerFields {
      adsense { homeBigAdSense1 postBigAdSense1 }
      gateBanner { ${SLOT} } bigBanner1 { ${SLOT} } littleBanner1 { ${SLOT} }
    } }
  }`)
  const menu = data.menuItems.nodes
  check(
    'menu items',
    menu.length > 5,
    `${menu.length}, ${menu.filter((m) => m.parentId).length} submenu items`,
  )
  const cloud = data.tagCloud?.tagCloudFields?.tagCloud?.nodes ?? []
  check('tag cloud', cloud.length > 0, `${cloud.length} tags`)
  check(
    'banners options page',
    !!data.bannerek?.bannerFields,
    JSON.stringify(data.bannerek?.bannerFields?.adsense ?? null).slice(0, 80),
  )
  check(
    'Smart Cache keys header',
    keys.includes('graphql:Query'),
    keys
      ? `${keys.split(' ').length} keys`
      : 'missing: is WPGraphQL Smart Cache active?',
  )
  console.log(`     root query ${ms} ms`)
})

await run('home', async () => {
  const { data, ms } = await query(`{
    folder(id: "cimlap", idType: SLUG) { posts(first: 100, where: { orderby: { field: MENU_ORDER, order: ASC } }) { nodes { title menuOrder } } }
    frontPage: nodeByUri(uri: "/") { ... on Page { seo { fullHead } homepage { folderek1Bal { nodes { name } } folderek2Jobb { nodes { name } } } } }
    quotes(first: 10) { nodes { title quoteFields { nev } } }
    myGalleries(first: 10) { nodes { title featuredImage { node { sourceUrl } } } }
  }`)
  const posts = data.folder?.posts.nodes ?? []
  check('cimlap folder posts', posts.length > 0, `${posts.length}`)
  const orders = posts.map((p) => p.menuOrder ?? 0)
  check(
    'MENU_ORDER sorting',
    orders.every((o, i) => i === 0 || o >= orders[i - 1]),
    orders.slice(0, 8).join(','),
  )
  const hp = data.frontPage?.homepage
  check(
    'home folders (ACF homepage)',
    !!hp && (hp.folderek1Bal?.nodes?.length ?? 0) > 0,
  )
  check(
    'front page Yoast head',
    (data.frontPage?.seo?.fullHead ?? '').includes('og:'),
  )
  check(
    'quotes',
    data.quotes.nodes.length > 0,
    `${data.quotes.nodes.length}, nev: ${data.quotes.nodes[0]?.quoteFields?.nev ?? '-'}`,
  )
  check(
    'galleries',
    data.myGalleries.nodes.length > 0,
    `${data.myGalleries.nodes.length}`,
  )
  console.log(`     home query ${ms} ms`)
})

await run('post', async () => {
  const { data: list } = await query(`{ posts(first: 5) { nodes { uri } } }`)
  const uris = list.posts.nodes.map((p) => p.uri)
  let photon = 0
  let direct = 0
  for (const uri of uris) {
    const { data, ms } = await query(
      `query ($uri: String!) {
        nodeByUri(uri: $uri) { ... on Post {
          title content seo { fullHead }
          featuredImage { node { sourceUrl sized: sourceUrl(size: LARGE) } }
          kiemeltCimke { featuredTag { nodes { name ... on Tag { taxonomyColor { taxColor } } } } }
          tags { nodes { name taxonomyColor { taxColor } } }
        } }
        relatedPosts { relatedPostsFields { relatedPosts(first: 50) { nodes { ... on Post { uri } } } } }
      }`,
      { uri },
    )
    const post = data.nodeByUri
    if (uri === uris[0]) {
      check('post by uri', !!post?.title, `${uri} ${ms} ms`)
      const head = post?.seo?.fullHead ?? ''
      check('post Yoast head', head.includes('og:title'))
      // Yoast leaves the canonical out while the site is set to noindex
      // (remix); rr7 then adds its own. Prod must have it.
      console.log(
        `info Yoast canonical: ${/rel="canonical"/.test(head) ? 'yes' : 'no (expected only on a noindex backend)'}`,
      )
      check(
        'post featured image',
        !!post?.featuredImage?.node?.sourceUrl,
        post?.featuredImage?.node?.sized ?? '',
      )
      const related =
        data.relatedPosts?.relatedPostsFields?.relatedPosts?.nodes ?? []
      check(
        'related posts options page',
        related.length > 0,
        `${related.length}`,
      )
      const colours = (post?.tags?.nodes ?? []).map(
        (t) => t.taxonomyColor?.taxColor ?? 'none',
      )
      check(
        'tag colours (no ACF default #eda407 everywhere)',
        !colours.length || colours.some((c) => c !== '#eda407'),
        colours.slice(0, 5).join(','),
      )
    }
    const content = post?.content ?? ''
    photon += (
      content.match(/i[0-3]\.wp\.com\/[^"'\s]*wp-content\/uploads/g) ?? []
    ).length
    direct += (
      content.match(
        /(?<!i[0-3]\.wp\.com\/)wp\.szinhaz\.online\/wp-content\/uploads/g,
      ) ?? []
    ).length
  }
  console.log(
    `info content images in ${uris.length} posts: ${photon} via Jetpack image CDN, ${direct} direct`,
  )
})

await run('archive', async () => {
  const { data, ms } = await query(`{
    category: nodeByUri(uri: "/category/szinhaz/") { __typename ... on Category { name } }
    posts(first: 10, where: { orderby: { field: MENU_ORDER, order: ASC } }) { nodes { title } }
  }`)
  check(
    'category by uri',
    data.category?.__typename === 'Category',
    data.category?.name ?? 'missing',
  )
  check('posts list', data.posts.nodes.length === 10, `${ms} ms`)
})

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed')
process.exit(failures ? 1 : 0)
