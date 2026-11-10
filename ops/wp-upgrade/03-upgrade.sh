#!/bin/bash
# Phase A: upgrades WordPress + plugins and turns on GraphQL for rr7.
# Frontity keeps working afterwards (ACF to REST API and the core
# wp-sitemap.xml stay), so this can run while szinhaz.online is on Frontity.
# Usage: TARGET=<wp dir> bash 03-upgrade.sh    (default: the remix clone)
source ~/rehearsal/lib.sh
T=${TARGET:-$SUB/remix}
P=$R/pkg
echo "TARGET=$T"
w() { wp --path=$T "$@"; }

[ -f $T/.maintenance ] || echo '<?php $upgrading = time();' > $T/.maintenance

t 'core update 7.1.4' w core update --version=7.1.4 --locale=en_US
t 'core update-db' w core update-db
t 'core language' w language core update

# The 2020 feature plugin; core has had sitemaps since WP 5.5
drop_old() {
  w --skip-plugins plugin deactivate wp-sitemaps
  w --skip-plugins plugin delete wp-sitemaps
}
t 'remove wp-sitemaps feature plugin' drop_old

pro() {
  rm -rf $T/wp-content/plugins/advanced-custom-fields-pro $T/wp-content/plugins/add-wpgraphql-seo
  cp -a $P/advanced-custom-fields-pro $P/add-wpgraphql-seo $T/wp-content/plugins/
}
t 'ACF Pro 6.8.11 + add-wpgraphql-seo 6.0.0 from pkg' pro

t 'plugin update (wp.org)' w --skip-plugins plugin update --all --exclude=advanced-custom-fields-pro,add-wpgraphql-seo
t 'plugin languages' w language plugin update --all
t 'activate graphql plugins' w plugin activate wp-graphql wpgraphql-acf add-wpgraphql-seo
t 'plugin db upgrades (load once)' w option get wpseo --format=json >/dev/null
t 'apply rr7 config' w eval-file $R/apply-config.php $R/rr7-config.json
t 'mu-plugin: headless exceptions' cp $P/szinhaz-headless-exceptions.php $T/wp-content/mu-plugins/
t 'rewrite flush' w rewrite flush
t 'cache flush' w cache flush

w plugin list --fields=name,status,version --format=csv
rm -f $T/.maintenance
