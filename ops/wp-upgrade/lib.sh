# Shared helpers for the rehearsal scripts
set -euo pipefail
SUB=~/szinhaz.online/sub
R=~/rehearsal
# After every command, bump the web object cache version of the site it ran
# on (see object-cache.php): WP-CLI can't reach the web's memcache.
wp() {
  local rc=0 path
  php -d error_reporting=0 -d memory_limit=512M ~/wp-cli.phar "$@" || rc=$?
  for a in "$@"; do case $a in --path=*) path=${a#--path=};; esac; done
  [ -n "$path" ] && [ -f "$path/wp-content/object-cache.php" ] && touch "$path/wp-content/object-cache.version"
  return $rc
}
# t <label> <command...> : runs and logs the duration
t() {
  local label=$1; shift
  local s=$(date +%s)
  "$@"
  echo "[$(date +%F' '%T)] $(( $(date +%s) - s ))s  $label" | tee -a $R/timings.txt
}
