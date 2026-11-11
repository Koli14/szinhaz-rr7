#!/bin/bash
# Rollback of phase A: puts back the DB and code of a 01-snapshot-prod.sh
# snapshot. wp-config.php, uploads and caches are left alone.
#   SNAP=$R/before-phase-a TARGET=$SUB/wp bash 06-restore.sh
source ~/rehearsal/lib.sh
SNAP=${SNAP:?set SNAP to a 01-snapshot-prod.sh OUT folder}
T=${TARGET:?set TARGET}
[ -s $SNAP/prod-db.sql.gz ] && [ -f $SNAP/clone/wp-load.php ]
w() { wp --path=$T --skip-plugins --skip-themes "$@"; }

echo '<?php $upgrading = time();' > $T/.maintenance
# The dump drops and recreates every table it contains
import() { zcat $SNAP/prod-db.sql.gz | w db import -; }
t 'restore db' import
# Excluded paths are also kept by --delete. The rehearsal clone's no-mail
# mu-plugin must survive a restore on remix.
code() {
  rsync -a --delete \
    --exclude 'wp-content/uploads' --exclude 'wp-content/cache' \
    --exclude 'wp-content/wpo-cache' --exclude 'wp-content/debug.log' \
    --exclude 'wp-content/upgrade' --exclude 'wp-content/upgrade-temp-backup' \
    --exclude 'wp-config.php' --exclude '.maintenance' \
    --exclude 'wp-content/mu-plugins/rehearsal-no-mail.php' \
    $SNAP/clone/ $T/
}
t 'restore code' code
rm -f $T/.maintenance
t 'cache flush' w cache flush
w core version
w plugin list --fields=name,status,version --format=csv | grep -Ei 'graphql|acf|rest'
