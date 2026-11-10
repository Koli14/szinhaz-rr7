# Shared helpers for the rehearsal scripts
set -euo pipefail
SUB=~/szinhaz.online/sub
R=~/rehearsal
wp() { php -d error_reporting=0 -d memory_limit=512M ~/wp-cli.phar "$@"; }
# t <label> <command...> : runs and logs the duration
t() {
  local label=$1; shift
  local s=$(date +%s)
  "$@"
  echo "[$(date +%F' '%T)] $(( $(date +%s) - s ))s  $label" | tee -a $R/timings.txt
}
