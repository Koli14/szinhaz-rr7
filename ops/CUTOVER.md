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
- [x] Vercel project `berta/szinhaz-rr7`, deployed from GitHub `main`
      (Node 26.x, fra1, Fluid), Vercel Authentication off (the site sends
      noindex until phase B). It is the remix test site now: remix purges
      go to https://szinhaz-rr7-berta.vercel.app/api/revalidate. The old
      Hobby project `szinhaz-rr7` can be deleted.
- [x] Firewall copied from `szinhaz-online`: IP blocks 54.155.239.53 and
      54.229.183.196; "Allow feed readers" (bypass, UA
      `mszt.org|SimplePie|Photon/`); "Block scrapers" (deny, UA
      `HeadlessChrome|Lightpanda|^curl/`); Bot Protection: Log; OWASP rules
      gen/rce/sqli/xss: Log; AI bots off.
- [x] fbclid redirect, viewport prefetch of the lead stories.
- [ ] Production env vars of `berta/szinhaz-rr7`:

  | name                     | value                                                                            | when           |
  | ------------------------ | -------------------------------------------------------------------------------- | -------------- |
  | `GRAPHQL_API`            | remix now; `https://wp.szinhaz.online/graphql`                                   | after phase A  |
  | `SITE_URL`               | `https://szinhaz.online`                                                         | set            |
  | `CRON_SECRET`            | random                                                                           | set            |
  | `VERCEL_TEAM_ID`         | `berta` team id                                                                  | set            |
  | `REVALIDATE_SECRET`      | same as `SZINHAZ_PURGE_SECRET` in remix wp-config                                | set            |
  | `SITE_INDEXABLE`         | `true`                                                                           | phase B        |
  | `GA_MEASUREMENT_ID`      | `G-1LRX9ENL3S`                                                                   | phase B        |
  | `INSTAGRAM_ACCESS_TOKEN` | long-lived Instagram token                                                       | before phase B |
  | `GLOBAL_CONFIG`          | store `my-global-config-store` (shared with Frontity), token `szinhaz-rr7-token` | set            |
  | `VERCEL_API_TOKEN`       | owner creates it (berta scope, no expiry)                                        | before phase B |

- Consent: the Google CMP (AdSense Privacy & messaging, TCF) is already
  published for szinhaz.online and comes with adsbygoogle.js. rr7 sets
  consent mode v2 (denied by default in the EEA/UK/CH) and maps the TCF
  choices to it; the old info-only cookie bar is gone, the footer has
  "Süti beállítások" to reopen the CMP.

## A. Upgrade the prod WordPress (Frontity stays live)

About 5 minutes of script time; editors pause publishing for ~15 minutes.

1. `OUT=$R/before-phase-a bash 01-snapshot-prod.sh` (rollback point).
2. `TARGET=$SUB/wp bash 03-upgrade.sh`: WP 7.1.4, plugin updates, WPGraphQL
   with ACF, Smart Cache and Yoast SEO for GraphQL, rr7 GraphQL names,
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
2. Purge on prod, to the rr7 project with the same secret as remix
   (`wp config get SZINHAZ_PURGE_SECRET` in remix):
   `wp config set SZINHAZ_PURGE_URL https://szinhaz-rr7-berta.vercel.app/api/revalidate --type=constant`
   and `wp config set SZINHAZ_PURGE_SECRET … --type=constant` in `$SUB/wp`.
   Then delete both constants from the remix wp-config: remix edits must
   not purge pages that now show prod content.
3. `node scripts/url-parity.mjs --wp https://wp.szinhaz.online --base https://szinhaz-rr7-berta.vercel.app --ref https://szinhaz.online --posts 300 --tags 150`.
4. Spot checks: images (Jetpack CDN in content?), banners, ads, related
   posts.

## B. Switch szinhaz.online to rr7

1. rr7 env: `SITE_INDEXABLE=true`, `GA_MEASUREMENT_ID`; redeploy.
2. Vercel `berta` → project `szinhaz-online` → Domains: move `szinhaz.online`
   (and `www`, if listed) to the rr7 project. No DNS change.
3. `PURGE_URL=https://szinhaz.online/api/revalidate PURGE_SECRET=… TARGET=$SUB/wp bash 04-switch-to-rr7.sh`
   (Yoast XML sitemaps on; purge constants).
4. Checks: home, post, archive, search, gallery, `/feed/`,
   `/sitemap_index.xml`, `/wp-sitemap.xml` (→ redirect), `/robots.txt`,
   `/ads.txt`, 404 page; the consent message appears (EEA, fresh browser);
   GA4 Realtime; Facebook Sharing Debugger on a post;
   publish/edit → page refreshes; Vercel logs for errors.
5. Search Console: submit `https://szinhaz.online/sitemap_index.xml`.
6. GA4 (G-1LRX9ENL3S) → Data streams → Enhanced measurement → Page views:
   turn off "Page changes based on browser history events" right after the
   switch. Frontity needs it (its GA4 page views come from the connected
   UA tag), rr7 sends its own page_view per navigation.

Rollback: move the domain back to `szinhaz-online` (seconds), turn the GA4
history setting back on, and turn the
Yoast sitemap off again (`wp eval 'WPSEO_Options::set("enable_xml_sitemap", false);'`),
because Frontity serves the core `wp-sitemap.xml`.

## C. After 1–2 weeks without rollback

1. `TARGET=$SUB/wp bash 05-cleanup.sh` (ACF to REST API, WP REST Cache,
   menus-endpoints).
2. Frontity project: pause or delete; close szinhaz.live PR #10.
3. Compare the Vercel invoice and GA4 traffic with the Frontity period.
4. Delete `$R/before-phase-a`, `$R/remix-snap` and the remix clone, if no
   longer needed.
