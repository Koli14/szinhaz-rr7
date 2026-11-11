#!/bin/bash
# Phase B, right after szinhaz.online is moved to rr7: Yoast XML sitemaps
# replace the core wp-sitemap.xml (rr7 proxies the Yoast ones and redirects
# the old wp-sitemap URLs). Content changes start invalidating the rr7 CDN
# cache (mu-plugin szinhaz-vercel-purge.php).
#   PURGE_URL=https://szinhaz.online/api/revalidate \
#   PURGE_SECRET=<REVALIDATE_SECRET of the Vercel project> \
#   TARGET=~/szinhaz.online/sub/wp bash 04-switch-to-rr7.sh
source ~/rehearsal/lib.sh
: "${PURGE_URL:?set PURGE_URL}" "${PURGE_SECRET:?set PURGE_SECRET}"
T=${TARGET:-$SUB/remix}
w() { wp --path=$T "$@"; }
t 'enable Yoast XML sitemap' w eval 'WPSEO_Options::set("enable_xml_sitemap", true);'
t 'vercel purge constants' eval 'w config set SZINHAZ_PURGE_URL "$PURGE_URL" --type=constant && w config set SZINHAZ_PURGE_SECRET "$PURGE_SECRET" --type=constant'
t 'rewrite flush' w rewrite flush
t 'cache flush' w cache flush
