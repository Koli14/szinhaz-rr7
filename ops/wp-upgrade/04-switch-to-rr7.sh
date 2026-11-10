#!/bin/bash
# Phase B, right after szinhaz.online is moved to rr7: Yoast XML sitemaps
# replace the core wp-sitemap.xml (rr7 proxies the Yoast ones and redirects
# the old wp-sitemap URLs).
source ~/rehearsal/lib.sh
T=${TARGET:-$SUB/remix}
w() { wp --path=$T "$@"; }
t 'enable Yoast XML sitemap' w eval 'WPSEO_Options::set("enable_xml_sitemap", true);'
t 'rewrite flush' w rewrite flush
t 'cache flush' w cache flush
