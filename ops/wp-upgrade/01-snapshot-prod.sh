#!/bin/bash
# Read-only on prod: DB dump + code copy without uploads.
#   bash 01-snapshot-prod.sh                       → $R/prod-db.sql.gz + $R/clone
#                                                    (input of 02-build-clone.sh)
#   OUT=$R/before-phase-a bash 01-snapshot-prod.sh → rollback point for
#                                                    06-restore.sh
# SRC=$SUB/remix snapshots remix instead (to rehearse the restore).
source ~/rehearsal/lib.sh
SRC=${SRC:-$SUB/wp}
OUT=${OUT:-$R}
mkdir -p $OUT
dump() { wp --path=$SRC --skip-plugins --skip-themes db export --single-transaction --quick - | gzip > $OUT/prod-db.sql.gz; }
copy() {
  rsync -a --delete \
    --exclude 'wp-content/uploads' --exclude 'wp-content/cache' \
    --exclude 'wp-content/wpo-cache' --exclude 'wp-content/debug.log' \
    --exclude 'wp-content/upgrade' --exclude 'wp-content/upgrade-temp-backup' \
    --exclude 'wp-config.php' \
    $SRC/ $OUT/clone/
}
t "db export $SRC (gz)" dump
t "code copy $SRC (no uploads)" copy
ls -la $OUT/prod-db.sql.gz; du -sh $OUT/clone
zcat $OUT/prod-db.sql.gz | tail -1
