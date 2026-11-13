<?php
/**
 * Plugin Name: Színház hide users
 * Description: Keeps WordPress user names and login slugs away from anonymous visitors: the REST users endpoint, the user objects of WPGraphQL and the author link of oEmbed. Logged-in users (the editor) see everything as before.
 *
 * The rr7 frontend never asks for users: the byline comes from Yoast's head
 * (the user's display name) and rr7 only lets known names through.
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

// /wp-json/wp/v2/users and /users/<id> listed every author with their slug
add_filter(
	'rest_pre_dispatch',
	function ( $result, $server, $request ) {
		if ( ! is_user_logged_in() && preg_match( '~^/wp/v2/users(/|$)~', $request->get_route() ) ) {
			return new WP_Error( 'rest_forbidden', 'Forbidden', [ 'status' => 401 ] );
		}
		return $result;
	},
	10,
	3
);

// { users { nodes { name slug } } } and post { author { node { slug } } }
add_filter(
	'graphql_object_visibility',
	function ( $visibility, $model_name ) {
		if ( 'UserObject' === $model_name && ! is_user_logged_in() ) {
			return 'private';
		}
		return $visibility;
	},
	10,
	2
);

// /wp-json/oembed/1.0/embed?url=… linked the author archive (the slug)
add_filter(
	'oembed_response_data',
	function ( $data ) {
		unset( $data['author_url'] );
		return $data;
	}
);
