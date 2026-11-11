# Cutover: szinhaz.online from Frontity to rr7

Rehearsed on remix.szinhaz.online (full prod clone) on 2026-11-10/11. Every
step that changes prod needs the owner's go. Shell: the Websupport basic
shell, scripts in `~/rehearsal/` (copies of `ops/wp-upgrade/`), `$R` =
`~/rehearsal`, `$SUB` = `~/szinhaz.online/sub`.

The WordPress upgrade (phase A) and the frontend switch (phase B) are
separate: Frontity keeps working on the upgraded WordPress, so neither step
has downtime, and each one can be rolled back on its own.

## 0. Preparation (no prod change)

- [x] rr7 parity with Frontity: URL parity (status, title, canonical), UI,
      ads, banners, feed, sitemaps, robots.txt, ads.txt, GA4, Instagram.
- [x] Upgrade, rollback and CDN purge rehearsed on remix.
- [ ] Vercel: move the `szinhaz-rr7` project from the Hobby scope to the
      `berta` team (Settings → General → Transfer). Hobby is non-commercial,
      and the domain and its DNS live in `berta`.
- [ ] Firewall in the rr7 project, same as `szinhaz-online`: IP blocks
      54.155.239.53 and 54.229.183.196; "Allow feed readers" (bypass,
      UA `mszt.org|SimplePie|Photon/`); "Block scrapers" (deny, UA
      `HeadlessChrome|Lightpanda|^curl/`); Bot Protection: Log; AI bots off.
- [ ] Production env vars of the rr7 project:

  | name                     | value                                        | when           |
  | ------------------------ | -------------------------------------------- | -------------- |
  | `GRAPHQL_API`            | `https://wp.szinhaz.online/graphql`          | after phase A  |
  | `SITE_URL`               | `https://szinhaz.online`                     | phase B        |
  | `SITE_INDEXABLE`         | `true`                                       | phase B        |
  | `GA_MEASUREMENT_ID`      | `G-1LRX9ENL3S` (GA4 property from Site Kit)  | phase B        |
  | `REVALIDATE_SECRET`      | random, same as `SZINHAZ_PURGE_SECRET` in WP | set (rotate?)  |
  | `CRON_SECRET`            | random                                       | before phase B |
  | `INSTAGRAM_ACCESS_TOKEN` | long-lived Instagram token                   | before phase B |
  | `GLOBAL_CONFIG`          | added by connecting a Global Config store    | before phase B |
  | `VERCEL_API_TOKEN`       | token that may write the store               | before phase B |
  | `VERCEL_TEAM_ID`         | `berta` team id                              | before phase B |

- [ ] GA4 (G-1LRX9ENL3S) → Data streams → Enhanced measurement → Page views
      → turn off "Page changes based on browser history events" (rr7 sends
      its own page_view per navigation; otherwise they count twice).

## A. Upgrade the prod WordPress (Frontity stays live)

About 5 minutes of script time; editors pause publishing for ~15 minutes.

1. `OUT=$R/before-phase-a bash 01-snapshot-prod.sh` (rollback point).
2. `TARGET=$SUB/wp bash 03-upgrade.sh` — WP 7.1.4, plugin updates, WPGraphQL
   - ACF + Smart Cache + Yoast SEO for GraphQL, rr7 GraphQL names,
     mu-plugins (the purge one stays inactive without its constants).
3. Check Frontity on szinhaz.online: home, a post, an archive, search,
   `/feed/`, `/wp-sitemap.xml`, banners, a new test publish (then delete).
4. `node scripts/check-graphql.mjs https://wp.szinhaz.online/graphql` —
   all ok, and "Yoast canonical: yes". Note the Jetpack image CDN count.
5. Editors can publish again.

Rollback: `SNAP=$R/before-phase-a TARGET=$SUB/wp bash 06-restore.sh`
(~1 minute; posts published after the snapshot are lost).

## A'. rr7 on prod data, before the switch

1. rr7 `GRAPHQL_API` → `https://wp.szinhaz.online/graphql`, redeploy.
2. Purge constants on prod, pointing at the rr7 project (keeps working after
   the switch, the cache tags belong to the project):
   `wp config set SZINHAZ_PURGE_URL https://szinhaz-rr7.vercel.app/api/revalidate --type=constant`
   and `SZINHAZ_PURGE_SECRET` (= `REVALIDATE_SECRET`).
3. `node scripts/url-parity.mjs --wp https://wp.szinhaz.online --base https://szinhaz-rr7.vercel.app --ref https://szinhaz.online --posts 300 --tags 150`.
4. Spot checks: images (Jetpack CDN in content?), banners, ads, related
   posts, a publish → the home page updates within seconds.

## B. Switch szinhaz.online to rr7

1. rr7 env: `SITE_URL`, `SITE_INDEXABLE=true`, `GA_MEASUREMENT_ID`; redeploy.
2. Vercel `berta` → project `szinhaz-online` → Domains: move `szinhaz.online`
   (and `www`, if listed) to the rr7 project. No DNS change.
3. `PURGE_URL=https://szinhaz.online/api/revalidate PURGE_SECRET=… TARGET=$SUB/wp bash 04-switch-to-rr7.sh`
   (Yoast XML sitemaps on; purge constants).
4. Checks: home, post, archive, search, gallery, `/feed/`,
   `/sitemap_index.xml`, `/wp-sitemap.xml` (→ redirect), `/robots.txt`,
   `/ads.txt`, 404 page; GA4 Realtime; Facebook Sharing Debugger on a post;
   publish/edit → page refreshes; Vercel logs for errors.
5. Search Console: submit `https://szinhaz.online/sitemap_index.xml`.

Rollback: move the domain back to `szinhaz-online` (seconds) and turn the
Yoast sitemap off again (`wp eval 'WPSEO_Options::set("enable_xml_sitemap", false);'`),
because Frontity serves the core `wp-sitemap.xml`.

## C. After 1–2 weeks without rollback

1. `TARGET=$SUB/wp bash 05-cleanup.sh` (ACF to REST API, WP REST Cache,
   menus-endpoints).
2. Frontity project: pause or delete; close szinhaz.live PR #10.
3. Compare the Vercel invoice and GA4 traffic with the Frontity period.
4. Delete `$R/before-phase-a`, `$R/remix-snap` and the remix clone, if no
   longer needed.
