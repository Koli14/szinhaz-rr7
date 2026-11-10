#!/bin/bash
# Puts the prod code + DB on remix.szinhaz.online (rehearsal only).
source ~/rehearsal/lib.sh
C=$R/clone
rm -f $C/wp-cli.phar

# wp-config: remix DB, prod table prefix, remix URLs, no cron, no mail.
# On a rerun the original remix install is already in $R/remix-orig.
ORIG=$SUB/remix
[ -d $R/remix-orig ] && ORIG=$R/remix-orig
cp $ORIG/wp-config.php $C/wp-config.php
sed -i "s/^\$table_prefix = 'remix_';/\$table_prefix = '<prefix>';/" $C/wp-config.php
sed -i "s/^define( 'WP_DEBUG', false );/define( 'WP_DEBUG', true );/" $C/wp-config.php
grep -q "^\$table_prefix = '<prefix>';" $C/wp-config.php
EXTRA="define( 'WP_HOME', 'https://remix.szinhaz.online' );
define( 'WP_SITEURL', 'https://remix.szinhaz.online' );
define( 'WPLANG', 'hu_HU' );
define( 'WP_MEMORY_LIMIT', '512M' );
define( 'WP_POST_REVISIONS', false );
define( 'DISABLE_WP_CRON', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'JETPACK_STAGING_MODE', true );
define( 'HEADLESS_MODE_CLIENT_URL', 'https://szinhaz-rr7.vercel.app' );"
php -r '
$f = $argv[1]; $extra = $argv[2];
$s = file_get_contents($f);
$marker = "/* That'"'"'s all, stop editing!";
if (strpos($s, $marker) === false) { fwrite(STDERR, "marker missing\n"); exit(1); }
file_put_contents($f, str_replace($marker, $extra . "\n\n" . $marker, $s));
' $C/wp-config.php "$EXTRA"

# The clone must never send mail to real users
cat > $C/wp-content/mu-plugins/rehearsal-no-mail.php <<'PHP'
<?php
// Rehearsal clone only: never send e-mails.
add_filter('pre_wp_mail', '__return_false');
PHP
mkdir -p $C/wp-content/uploads
touch $C/.maintenance
echo '<?php $upgrading = time();' > $C/.maintenance

swap() {
  if [ -d $R/remix-orig ]; then rm -rf $SUB/remix; else mv $SUB/remix $R/remix-orig; fi
  mv $C $SUB/remix
}
t 'swap remix dir -> clone' swap

import() { zcat $R/prod-db.sql.gz | wp --path=$SUB/remix db import -; }
t 'import prod db into remix db' import

safety() {
  wp --path=$SUB/remix --skip-plugins --skip-themes plugin deactivate jetpack
  wp --path=$SUB/remix --skip-plugins --skip-themes option update blog_public 0
  wp --path=$SUB/remix --skip-plugins --skip-themes option update upload_url_path 'https://wp.szinhaz.online/wp-content/uploads'
}
t 'clone safety settings' safety
wp --path=$SUB/remix --skip-plugins --skip-themes db query "SELECT COUNT(*) posts FROM <prefix>posts WHERE post_type='post' AND post_status='publish'"
