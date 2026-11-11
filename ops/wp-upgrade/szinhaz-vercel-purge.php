<?php
/**
 * Plugin Name: Színház.online Vercel cache purge
 * Description: Forwards WPGraphQL Smart Cache purge events to the rr7 frontend, which invalidates the Vercel CDN pages tagged with the same keys.
 *
 * The rr7 frontend tags every page with the X-GraphQL-Keys of the queries
 * it ran (node ids, list:post, graphql:Query, …). Smart Cache fires
 * `graphql_purge` with those keys when content changes; they are collected
 * during the request and sent in one call when it ends.
 *
 * Needs in wp-config.php (does nothing without them):
 *   define( 'SZINHAZ_PURGE_URL', 'https://szinhaz.online/api/revalidate' );
 *   define( 'SZINHAZ_PURGE_SECRET', '…' ); // = REVALIDATE_SECRET on Vercel
 */

if ( ! defined( 'ABSPATH' ) || ! defined( 'SZINHAZ_PURGE_URL' ) || ! defined( 'SZINHAZ_PURGE_SECRET' ) ) {
	return;
}

final class Szinhaz_Vercel_Purge {
	/** Above this, purge everything instead of sending a huge list */
	const MAX_TAGS = 500;

	/** @var array<string,true> */
	private static $tags = [];

	public static function init() {
		add_action( 'graphql_purge', [ __CLASS__, 'on_purge' ], 10, 1 );
		add_action( 'wpgraphql_cache_purge_all', [ __CLASS__, 'purge_all' ], 10, 0 );
		// ACF options pages (banners, tag cloud, related posts) are saved as
		// options, which Smart Cache does not watch
		add_action( 'acf/save_post', [ __CLASS__, 'on_acf_save' ], 20, 1 );
		add_action( 'shutdown', [ __CLASS__, 'send' ], 100, 0 );
	}

	public static function add( $tag ) {
		if ( is_string( $tag ) && '' !== $tag && false === strpos( $tag, ',' ) ) {
			self::$tags[ $tag ] = true;
		}
	}

	public static function on_purge( $key ) {
		// Query document hashes: rr7 does not use persisted queries
		if ( is_string( $key ) && preg_match( '/^[0-9a-f]{64}$/', $key ) ) {
			return;
		}
		self::add( $key );
	}

	public static function purge_all() {
		self::add( 'graphql:Query' );
	}

	public static function on_acf_save( $post_id ) {
		if ( is_numeric( $post_id ) || ! function_exists( 'acf_get_options_pages' ) ) {
			return;
		}
		$found = false;
		foreach ( (array) acf_get_options_pages() as $page ) {
			if ( isset( $page['post_id'], $page['menu_slug'] ) && $page['post_id'] === $post_id ) {
				// WPGraphQL for ACF: node id of the options page
				self::add( base64_encode( 'acf_options_page:' . $page['menu_slug'] ) );
				$found = true;
			}
		}
		if ( ! $found ) {
			self::purge_all();
		}
	}

	public static function send() {
		if ( empty( self::$tags ) ) {
			return;
		}
		$tags       = array_keys( self::$tags );
		self::$tags = [];
		if ( count( $tags ) > self::MAX_TAGS ) {
			$tags = [ 'graphql:Query' ];
		}

		// Let the editor's browser go first; the call can take a moment
		if ( function_exists( 'fastcgi_finish_request' ) ) {
			fastcgi_finish_request();
		}

		$response = wp_remote_post(
			SZINHAZ_PURGE_URL,
			[
				'timeout' => 10,
				'headers' => [
					'Authorization' => 'Bearer ' . SZINHAZ_PURGE_SECRET,
					'Content-Type'  => 'application/json',
				],
				'body'    => wp_json_encode( [ 'tags' => $tags ] ),
			]
		);

		$code = is_wp_error( $response ) ? $response->get_error_message() : wp_remote_retrieve_response_code( $response );
		if ( 200 !== $code ) {
			error_log( sprintf( '[szinhaz-vercel-purge] %s failed for %d tags: %s', SZINHAZ_PURGE_URL, count( $tags ), $code ) );
		}
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			WP_CLI::log( sprintf( 'Vercel purge (%s): %s', $code, implode( ' ', $tags ) ) );
		}
	}
}

Szinhaz_Vercel_Purge::init();
