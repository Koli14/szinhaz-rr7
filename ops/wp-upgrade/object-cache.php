<?php
/**
 * Persistent object cache for the Websupport hosting: the server's memcache
 * (127.0.0.1:11211) through the drop-in of the "Memcached Object Cache"
 * plugin (wp-content/plugins/memcached, not activated, only its file is used).
 * Websupport also prefixes memcache keys per host, so wp. and remix. never
 * share entries.
 *
 * Web requests only: WP-CLI in the Websupport shell runs in another container
 * without memcache, so it keeps WordPress' per-request cache and can't flush
 * the web's. The key salt therefore includes the mtime of
 * wp-content/object-cache.version: `touch` it after changing data with WP-CLI
 * (ops/wp-upgrade/lib.sh does it after every wp command) and the web starts
 * over with an empty cache; old entries are evicted by memcache.
 *
 * Copy to wp-content/object-cache.php. Remove that file to switch it off.
 */
if ( PHP_SAPI === 'cli' || ! class_exists( 'Memcache' ) ) {
	return;
}
if ( ! file_exists( WP_CONTENT_DIR . '/plugins/memcached/object-cache.php' ) ) {
	return;
}
if ( ! defined( 'WP_CACHE_KEY_SALT' ) ) {
	$szinhaz_cache_version = (int) @filemtime( WP_CONTENT_DIR . '/object-cache.version' );
	define( 'WP_CACHE_KEY_SALT', ( $_SERVER['HTTP_HOST'] ?? 'wp' ) . ':' . $szinhaz_cache_version . ':' );
}
$memcached_servers = array( 'default' => array( '127.0.0.1:11211' ) );
require WP_CONTENT_DIR . '/plugins/memcached/object-cache.php';
