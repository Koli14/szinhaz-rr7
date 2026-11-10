#!/bin/bash
# Read-only on prod: DB dump + code copy without uploads.
source ~/rehearsal/lib.sh
dump() { wp --path=$SUB/wp --skip-plugins --skip-themes db export --single-transaction --quick - | gzip > $R/prod-db.sql.gz; }
copy() {
  rsync -a --delete \
    --exclude 'wp-content/uploads' --exclude 'wp-content/cache' \
    --exclude 'wp-content/wpo-cache' --exclude 'wp-content/debug.log' \
    --exclude 'wp-content/upgrade' --exclude 'wp-content/upgrade-temp-backup' \
    --exclude 'wp-config.php' \
    $SUB/wp/ $R/clone/
}
t 'prod db export (gz)' dump
t 'prod code copy (no uploads)' copy
ls -la $R/prod-db.sql.gz; du -sh $R/clone
zcat $R/prod-db.sql.gz | tail -1
