# WordPress upgrade for rr7

Scripts for upgrading the prod WordPress (wp.szinhaz.online) in place so it
can serve rr7 over GraphQL. They run in the Websupport basic shell
(`ssh -p <port> <user>@shell.websupport.cz`) from `~/rehearsal/`.

Rehearsed on 2026-11-10 on remix.szinhaz.online with a full copy of the prod
database and code (uploads stay on prod, `upload_url_path` points there).

| script                | what                                                                                 | prod?                            |
| --------------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| `01-snapshot-prod.sh` | prod DB dump + code copy without uploads (read-only)                                 | backup before phase A            |
| `02-build-clone.sh`   | puts the snapshot on remix (no mail, no cron, Jetpack off)                           | rehearsal only                   |
| `03-upgrade.sh`       | **phase A**: WP 7.1.4, plugin updates, GraphQL plugins, rr7 ACF/CPT UI GraphQL names | `TARGET=~/szinhaz.online/sub/wp` |
| `04-switch-to-rr7.sh` | **phase B**: Yoast XML sitemaps on (after szinhaz.online points to rr7)              | yes                              |
| `05-cleanup.sh`       | **phase C**: removes ACF to REST API, WP REST Cache, menus-endpoints                 | after the rollback window        |

Phase A keeps Frontity working: ACF to REST API and the core `wp-sitemap.xml`
stay, and the Frontity HTML rendered against the upgraded clone matched the
live site. So the upgrade and the frontend switch are separate steps.

Files `03-upgrade.sh` needs in `~/rehearsal/`:

- `pkg/advanced-custom-fields-pro/` (6.8.11, licensed, not on wordpress.org)
- `pkg/add-wpgraphql-seo/` (6.0.0)
- `pkg/szinhaz-headless-exceptions.php` (lets Yoast sitemaps through headless-mode)
- `pkg/szinhaz-graphql.php` (related posts options page in GraphQL; no default
  tag colour in GraphQL, as in REST)
- `apply-config.php`, `rr7-config.json`, `lib.sh`

`rr7-config.json` holds the ACF field groups and CPT UI post types of the
configured test site. Only the GraphQL keys are applied, matched by group and
field key, so the prod field definitions stay untouched.

Restore: `prod-db.sql.gz` from `01-snapshot-prod.sh` plus the code copy
(`rsync` back without `wp-content/uploads`).
