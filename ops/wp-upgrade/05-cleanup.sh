#!/bin/bash
# Phase C, after the rollback window: removes what only Frontity needed.
source ~/rehearsal/lib.sh
T=${TARGET:-$SUB/remix}
w() { wp --path=$T "$@"; }
remove() {
  w --skip-plugins plugin deactivate acf-to-rest-api wp-rest-cache menus-endpoints
  w --skip-plugins plugin delete acf-to-rest-api wp-rest-cache menus-endpoints
  rm -f $T/wp-content/mu-plugins/wp-rest-cache.php
}
t 'remove Frontity-only plugins' remove
t 'cache flush' w cache flush
