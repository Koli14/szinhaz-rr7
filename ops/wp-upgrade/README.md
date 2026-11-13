# WordPress upgrade for rr7

Scripts for upgrading the prod WordPress (wp.szinhaz.online) in place so it
can serve rr7 over GraphQL. They run in the Websupport basic shell
(`ssh -p <port> <user>@shell.websupport.cz`) from `~/rehearsal/`.

Rehearsed on 2026-11-10 on remix.szinhaz.online with a full copy of the prod
database and code (uploads stay on prod, `upload_url_path` points there).

| script                | what                                                                                  | prod?                            |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------- |
| `01-snapshot-prod.sh` | prod DB dump + code copy without uploads (read-only)                                  | backup before phase A            |
| `02-build-clone.sh`   | puts the snapshot on remix (no mail, no cron, Jetpack off)                            | rehearsal only                   |
| `03-upgrade.sh`       | **phase A**: WP 7.1.4, plugin updates, GraphQL plugins, rr7 ACF/CPT UI GraphQL names  | `TARGET=~/szinhaz.online/sub/wp` |
| `04-switch-to-rr7.sh` | **phase B**: Yoast XML sitemaps on, CDN purge on (after szinhaz.online points to rr7) | yes                              |
| `05-cleanup.sh`       | **phase C**: removes ACF to REST API, WP REST Cache, menus-endpoints                  | after the rollback window        |
| `06-restore.sh`       | rollback of phase A from an `OUT=… 01-snapshot-prod.sh` snapshot (~1 min)             | only if phase A goes wrong       |

Phase A keeps Frontity working: ACF to REST API and the core `wp-sitemap.xml`
stay, and the Frontity HTML rendered against the upgraded clone matched the
live site. So the upgrade and the frontend switch are separate steps.

Files `03-upgrade.sh` needs in `~/rehearsal/`:

- `pkg/advanced-custom-fields-pro/` (6.8.11, licensed, not on wordpress.org)
- `pkg/add-wpgraphql-seo/` (6.0.0)
- `pkg/szinhaz-headless-exceptions.php` (lets Yoast sitemaps through headless-mode)
- `pkg/szinhaz-graphql.php` (related posts options page in GraphQL; no default
  tag colour in GraphQL, as in REST)
- `pkg/szinhaz-vercel-purge.php` (sends WPGraphQL Smart Cache purge events
  to rr7's `/api/revalidate`; inactive until phase B sets its constants)
- `apply-config.php`, `rr7-config.json`, `lib.sh`

## CDN cache invalidation

rr7 tags every page with the `X-GraphQL-Keys` of its GraphQL queries (node
ids, `list:post`, `graphql:Query`, ACF options page ids) as Vercel cache tags,
so posts can be cached for a week and lists for an hour. When content
changes, WPGraphQL Smart Cache fires `graphql_purge` with the same keys;
`szinhaz-vercel-purge.php` collects them and posts them once per request to
`/api/revalidate` (`Authorization: Bearer $REVALIDATE_SECRET`), which marks
the matching pages stale. Saving an ACF options page purges that page's id.
Failures are written to the PHP error log. On remix the constants point to
`https://szinhaz-rr7.vercel.app/api/revalidate`.

`rr7-config.json` holds the ACF field groups and CPT UI post types of the
configured test site. Only the GraphQL keys are applied, matched by group and
field key, so the prod field definitions stay untouched.

Restore: `SNAP=$R/before-phase-a TARGET=$SUB/wp bash 06-restore.sh` puts back the
DB and code of the snapshot (`wp-config.php`, uploads and caches stay).
Rehearsed on remix on 2026-11-11: 45 s DB, 1 s code.

The full cutover runbook is in [`../CUTOVER.md`](../CUTOVER.md).

## SEO settings on prod (2026-11-13)

Set in the WordPress admin, not by a script:

- EWWW Image Optimizer → Max Image Dimensions: width 1200 (was 800). Google
  Discover shows a large card only for images at least 1200 px wide; rr7
  still serves sized variants. Only new uploads are affected.
- Settings → Reading: 30 posts in feeds (was 10).
- Users: display names are real names (`Tóth Berta`, `Vass Kata`), not the
  login or the nickname. Yoast prints the display name as the author.
- Yoast SEO → Settings, no English text left:
  - tags: `%%term_title%% – hírek, cikkek %%page%% %%sep%% %%sitename%%`,
    description `%%term_title%% – a legfrissebb hírek, interjúk és
    háttéranyagok egy helyen a Színház.online-on.`
  - categories: `%%term_title%% rovat …`, description `%%term_title%% rovat –
    friss hírek, interjúk és beszámolók a színházi világból a
    Színház.online-on.`
  - folders: `%%term_title%% …`, description `%%term_title%% – válogatás a
    Színház.online cikkeiből.`
  - gallery and quote archives without "Archive"; search and 404 titles,
    breadcrumbs (`Címlap`) in Hungarian
  - RSS: `Forrás: %%POSTLINK%% – %%BLOGLINK%%` after each post

`szinhaz-hide-users.php` (this folder) is **not installed yet**: copy it to
`wp-content/mu-plugins/` after trying it on a clone. Until then
`/wp-json/wp/v2/users` and GraphQL `users` list the login slugs to anyone.

## Performance settings on prod (2026-11-11)

- PHP 8.5 (Websupport admin → hosting service `szinhaz.online` → Szolgáltatás).
  OPcache runs in file-cache-only mode there; WordPress' Site Health still
  reports it as off.
- `WP_DEBUG` off; PHP errors go to `~/szinhaz.online/wp-logs/php-error.log`
  (outside the web roots).
- Persistent object cache: `object-cache.php` (this folder) in `wp-content/`,
  using the drop-in of the **inactive** "Memcached Object Cache" plugin
  (`plugins/memcached`, keep it: phase C must not delete it) and the server's
  memcache. WP-CLI can't reach that memcache, so `lib.sh`'s `wp()` touches
  `wp-content/object-cache.version` after every command, which gives the web
  a fresh cache. To switch it off, delete `wp-content/object-cache.php`.
- WPGraphQL: no public introspection, query depth limit 15 (rr7 needs ~7).
